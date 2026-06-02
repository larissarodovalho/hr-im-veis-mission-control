import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Copy, Plus, Trash2, Pencil, Facebook, CheckCircle2, AlertCircle, Loader2, ExternalLink, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STAGES } from "@/lib/leads";
import { useMetaLeadForms, MetaLeadForm, MetaLeadFormInput } from "@/hooks/useMetaLeadForms";
import { useEffect } from "react";

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-leadgen-webhook`;

type Corretor = { user_id: string; nome: string | null };

function useCorretores() {
  const [list, setList] = useState<Corretor[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .order("nome", { ascending: true });
      setList((data as any) ?? []);
    })();
  }, []);
  return list;
}

export default function MetaLeadAdsTab() {
  const { forms, loading, create, update, remove } = useMetaLeadForms();
  const corretores = useCorretores();

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<any>(null);

  async function diagnosticar() {
    setDiagLoading(true);
    setDiagResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("meta-debug-subscription");
      if (error) throw new Error(error.message);
      setDiagResult(data);
      if ((data as any).ok) toast.success("Inscrição OK");
      else toast.warning("Inscrição com problemas — veja diagnóstico");
    } catch (e: any) {
      toast.error(e.message);
      setDiagResult({ errors: [{ step: "invoke", details: e.message }], diagnostico: [`❌ ${e.message}`] });
    } finally {
      setDiagLoading(false);
    }
  }

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MetaLeadForm | null>(null);
  const [form, setForm] = useState<MetaLeadFormInput>(emptyForm());

  function emptyForm(): MetaLeadFormInput {
    return {
      page_id: "",
      form_id: "",
      form_nome: "",
      tags: [],
      corretor_responsavel_id: null,
      etapa_funil_inicial: "Novo Lead",
      ativo: true,
    };
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(f: MetaLeadForm) {
    setEditing(f);
    setForm({
      page_id: f.page_id,
      form_id: f.form_id,
      form_nome: f.form_nome,
      tags: f.tags ?? [],
      corretor_responsavel_id: f.corretor_responsavel_id,
      etapa_funil_inicial: f.etapa_funil_inicial,
      ativo: f.ativo,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.page_id.trim() || !form.form_id.trim() || !form.form_nome.trim()) {
      toast.error("Page ID, Form ID e Nome são obrigatórios");
      return;
    }
    const res = editing ? await update(editing.id, form) : await create(form);
    if (!(res as any).error) {
      setDialogOpen(false);
    }
  }

  async function testarConexao() {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("meta-test-token");
      if (error) throw new Error(error.message);
      if ((data as any).ok) {
        setTestResult({ ok: true, msg: `Conectado à Página: ${data.page_name} (ID ${data.page_id})` });
        toast.success("Token válido");
      } else {
        setTestResult({ ok: false, msg: (data as any).error || "Token inválido" });
        toast.error((data as any).error || "Token inválido");
      }
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message });
      toast.error(e.message);
    } finally {
      setTesting(false);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  }

  const tagsStr = useMemo(
    () => (form.tags ?? []).join(", "),
    [form.tags],
  );

  return (
    <div className="space-y-4">
      {/* Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-primary" /> Meta Lead Ads — Webhook
          </CardTitle>
          <CardDescription>
            Configure a URL abaixo no seu App do Meta para que os leads dos anúncios
            caiam direto no CRM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>URL do Webhook (Callback URL)</Label>
            <div className="flex gap-2">
              <Input value={WEBHOOK_URL} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(WEBHOOK_URL, "URL")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={diagnosticar} disabled={diagLoading} variant="outline">
              {diagLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <AlertCircle className="h-4 w-4 mr-1" />}
              Diagnosticar inscrição
            </Button>
          </div>

          {diagResult && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
              <div className="font-medium">Diagnóstico</div>
              <ul className="space-y-1">
                {(diagResult.diagnostico ?? []).map((d: string, i: number) => (
                  <li key={i} className="font-mono text-xs">{d}</li>
                ))}
              </ul>

              {diagResult.subscribed_apps?.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-xs font-semibold mb-1">Apps inscritos:</div>
                  {diagResult.subscribed_apps.map((a: any) => (
                    <div key={a.app_id} className="text-xs font-mono">
                      • {a.name} ({a.app_id}) — campos: {(a.subscribed_fields ?? []).join(", ") || "—"}
                    </div>
                  ))}
                </div>
              )}

              {diagResult.forms?.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-xs font-semibold mb-1">Formulários da Página (use o ID no mapeamento):</div>
                  <div className="space-y-1">
                    {diagResult.forms.map((f: any) => (
                      <div key={f.id} className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-[10px]">{f.status}</Badge>
                        <span className="flex-1">{f.name}</span>
                        <code className="text-muted-foreground">{f.id}</code>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copy(f.id, "Form ID")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={testarConexao} disabled={testing} variant="outline">
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Testar token da Página
            </Button>
            {testResult && (
              <Badge
                className={
                  testResult.ok
                    ? "bg-green-500/15 text-green-600 border-green-500/30"
                    : "bg-red-500/15 text-red-600 border-red-500/30"
                }
                variant="outline"
              >
                {testResult.ok
                  ? <CheckCircle2 className="h-3 w-3 mr-1" />
                  : <AlertCircle className="h-3 w-3 mr-1" />}
                {testResult.msg}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Os tokens <code>META_VERIFY_TOKEN</code>, <code>META_PAGE_ACCESS_TOKEN</code> e{" "}
            <code>META_APP_SECRET</code> estão armazenados de forma segura no backend.
          </p>
        </CardContent>
      </Card>

      {/* Passo a passo */}
      <Card>
        <CardHeader>
          <CardTitle>Passo a passo no painel do Meta</CardTitle>
          <CardDescription>Siga uma vez para conectar a Página ao webhook.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step1">
              <AccordionTrigger>1. Adicionar produto "Webhooks" no App</AccordionTrigger>
              <AccordionContent className="text-sm space-y-2">
                <p>Em <a href="https://developers.facebook.com/apps" target="_blank" className="text-primary underline">developers.facebook.com/apps</a>, abra seu App → menu lateral "Adicionar produto" → <strong>Webhooks</strong>.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="step2">
              <AccordionTrigger>2. Configurar callback do webhook</AccordionTrigger>
              <AccordionContent className="text-sm space-y-2">
                <p>Em Webhooks → escolha objeto <strong>Page</strong> → "Subscribe to this object":</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Callback URL:</strong> cole a URL acima.</li>
                  <li><strong>Verify Token:</strong> cole o mesmo valor que você definiu como <code>META_VERIFY_TOKEN</code>.</li>
                </ul>
                <p>Clique em "Verify and Save". Se o Verify Token bater, será aceito imediatamente.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="step3">
              <AccordionTrigger>3. Inscrever no campo "leadgen"</AccordionTrigger>
              <AccordionContent className="text-sm space-y-2">
                <p>Na mesma tela (Page), clique em "Subscribe" no campo <strong>leadgen</strong>.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="step4">
              <AccordionTrigger>4. Conectar a Página ao App</AccordionTrigger>
              <AccordionContent className="text-sm space-y-2">
                <p>No final da tela de Webhooks, em "Add subscriptions", selecione sua Página de anúncios e confirme.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="step5">
              <AccordionTrigger>5. Mapear cada formulário aqui embaixo</AccordionTrigger>
              <AccordionContent className="text-sm space-y-2">
                <p>Para cada formulário que você publicar no Gerenciador de Anúncios, copie o <strong>Form ID</strong> e o <strong>Page ID</strong> e cadastre na seção abaixo.</p>
                <p>Você define tags, corretor responsável e etapa inicial — todo lead daquele formulário entra já direcionado.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="step6">
              <AccordionTrigger>6. Testar com lead falso</AccordionTrigger>
              <AccordionContent className="text-sm space-y-2">
                <p>
                  Use a{" "}
                  <a
                    href="https://developers.facebook.com/tools/lead-ads-testing"
                    target="_blank"
                    className="text-primary underline inline-flex items-center gap-1"
                  >
                    Lead Ads Testing Tool <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  para enviar um lead de teste. Ele deve aparecer em segundos no CRM (Leads → Novo Lead).
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Mapeamentos */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle>Mapeamento de Formulários</CardTitle>
            <CardDescription>
              Cada formulário do Meta vira leads com tags, corretor e etapa pré-definidos.
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Novo mapeamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar mapeamento" : "Novo mapeamento"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Page ID *</Label>
                    <Input
                      value={form.page_id}
                      onChange={(e) => setForm({ ...form, page_id: e.target.value })}
                      placeholder="123456789012345"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Form ID *</Label>
                    <Input
                      value={form.form_id}
                      onChange={(e) => setForm({ ...form, form_id: e.target.value })}
                      placeholder="987654321012345"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Nome do formulário *</Label>
                  <Input
                    value={form.form_nome}
                    onChange={(e) => setForm({ ...form, form_nome: e.target.value })}
                    placeholder="Captação Apto Sinop - Out/2026"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tags (separadas por vírgula)</Label>
                  <Input
                    value={tagsStr}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tags: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="meta_ads, sinop, apto"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Corretor responsável</Label>
                    <Select
                      value={form.corretor_responsavel_id ?? "none"}
                      onValueChange={(v) =>
                        setForm({ ...form, corretor_responsavel_id: v === "none" ? null : v })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Sem responsável —</SelectItem>
                        {corretores.map((c) => (
                          <SelectItem key={c.user_id} value={c.user_id}>
                            {c.nome || c.user_id.slice(0, 8)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Etapa inicial</Label>
                    <Select
                      value={form.etapa_funil_inicial}
                      onValueChange={(v) => setForm({ ...form, etapa_funil_inicial: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Ativo</Label>
                    <p className="text-xs text-muted-foreground">Quando desativado, leads desse formulário são ignorados.</p>
                  </div>
                  <Switch
                    checked={form.ativo ?? true}
                    onCheckedChange={(v) => setForm({ ...form, ativo: v })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={save}>{editing ? "Salvar" : "Criar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : forms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum formulário mapeado ainda. Clique em "Novo mapeamento" para cadastrar o primeiro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Form ID</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Corretor</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((f) => {
                    const corretor = corretores.find((c) => c.user_id === f.corretor_responsavel_id);
                    return (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.form_nome}</TableCell>
                        <TableCell className="font-mono text-xs">{f.form_id}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(f.tags ?? []).map((t) => (
                              <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{corretor?.nome || "—"}</TableCell>
                        <TableCell className="text-sm">{f.etapa_funil_inicial}</TableCell>
                        <TableCell>
                          {f.ativo
                            ? <Badge className="bg-green-500/15 text-green-600 border-green-500/30" variant="outline">Ativo</Badge>
                            : <Badge variant="outline">Inativo</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(f)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Excluir mapeamento "${f.form_nome}"?`)) remove(f.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
