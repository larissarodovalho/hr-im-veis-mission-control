import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Send, Search, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Campanha = {
  id: string;
  assunto: string;
  manchete: string | null;
  corpo: string | null;
  imoveis_ids: string[];
  status: string;
  total_destinatarios: number;
  total_enviados: number;
  total_falhas: number;
  created_at: string;
  enviada_em: string | null;
};

type Imovel = {
  id: string; titulo: string; cidade: string | null; bairro: string | null;
  valor: number | null; fotos: string[] | null; codigo: string | null;
};

const statusColor: Record<string, string> = {
  rascunho: "secondary",
  aguardando_aprovacao: "default",
  aprovada: "default",
  enviando: "default",
  enviada: "default",
  cancelada: "secondary",
};

const statusLabel: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovada: "Aprovada",
  enviando: "Enviando…",
  enviada: "Enviada",
  cancelada: "Cancelada",
};

export default function NewsletterCampanhas() {
  const [items, setItems] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Campanha | null>(null);
  const [aprovar, setAprovar] = useState<Campanha | null>(null);
  const [working, setWorking] = useState(false);
  const [testeOpen, setTesteOpen] = useState(false);
  const [testeEmail, setTesteEmail] = useState("");
  const [testando, setTestando] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("newsletter_campanhas")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Campanha[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleAprovar = async () => {
    if (!aprovar) return;
    setWorking(true);
    const { data, error } = await supabase.functions.invoke("newsletter-send-campaign", {
      body: { campanha_id: aprovar.id },
    });
    setWorking(false);
    setAprovar(null);
    if (error) return toast.error("Erro ao enviar: " + error.message);
    toast.success(`Enviados: ${data?.enviados ?? 0} · Falhas: ${data?.falhas ?? 0} · Suprimidos: ${data?.suprimidos ?? 0}`);
    load();
  };

  const handleTeste = async () => {
    if (!testeEmail.trim()) return toast.error("Informe o email");
    setTestando(true);
    try {
      // Busca até 3 imóveis disponíveis com foto
      const { data: imoveis } = await supabase
        .from("imoveis")
        .select("id,titulo,cidade,bairro,valor,fotos,codigo,quartos,vagas,area_util,status")
        .eq("status", "disponivel")
        .order("created_at", { ascending: false })
        .limit(12);
      const imoveisData = ((imoveis ?? []) as any[])
        .filter((im) => Array.isArray(im.fotos) && im.fotos.length)
        .slice(0, 3)
        .map((im) => ({
          id: im.id,
          titulo: im.titulo,
          cidade: im.cidade,
          bairro: im.bairro,
          valor: im.valor,
          foto: im.fotos[0],
          codigo: im.codigo,
          quartos: im.quartos,
          vagas: im.vagas,
          area_util: im.area_util,
        }));

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "newsletter-weekly",
          recipientEmail: testeEmail.trim(),
          idempotencyKey: `newsletter-test-${Date.now()}-${testeEmail.trim()}`,
          purpose: "transactional",
          templateData: {
            assunto: "HR Imóveis · Boletim semanal de Sinop",
            manchete: "Como está o mercado imobiliário de Sinop nesta semana",
            preheader: "Panorama do mercado de Sinop e imóveis selecionados pela equipe.",
            corpo:
              "Sinop segue com bom volume de procura por imóveis prontos para morar, especialmente nas regiões centrais e em bairros planejados como o Jardim Maringá. Imóveis de 3 quartos com vaga coberta continuam sendo os mais buscados pelas famílias que estão se mudando para a cidade.\n\nNeste boletim, nossa equipe reuniu alguns imóveis do nosso portfólio que vale a pena conhecer. Se quiser agendar uma visita ou tirar dúvidas sobre financiamento, é só responder este e-mail que um corretor entra em contato.",
            imoveis: imoveisData,
          },
        },
      });
      if (error) throw error;
      toast.success("Email de teste enfileirado! Chega em alguns segundos.");
      setTesteOpen(false);
    } catch (e: any) {
      toast.error("Erro: " + (e?.message ?? "falha ao enviar"));
    } finally {
      setTestando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => { setTesteEmail("larissadefreitas@hotmail.com"); setTesteOpen(true); }}>
          <Send className="h-4 w-4 mr-2" /> Enviar email de teste
        </Button>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nova campanha
        </Button>
      </div>

      <Dialog open={testeOpen} onOpenChange={setTesteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar email de teste</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Email destinatário</Label>
            <Input type="email" value={testeEmail} onChange={(e) => setTesteEmail(e.target.value)} placeholder="voce@exemplo.com" />
            <p className="text-xs text-muted-foreground">Será enviada uma prévia do template newsletter com 3 imóveis disponíveis do catálogo.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTesteOpen(false)} disabled={testando}>Cancelar</Button>
            <Button onClick={handleTeste} disabled={testando}>
              {testando ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Enviando…</> : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assunto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Destinatários</TableHead>
              <TableHead>Enviados / Falhas</TableHead>
              <TableHead>Criada</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma campanha ainda.</TableCell></TableRow>
            ) : items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.assunto}</TableCell>
                <TableCell><Badge variant={statusColor[c.status] as any}>{statusLabel[c.status] ?? c.status}</Badge></TableCell>
                <TableCell>{c.total_destinatarios}</TableCell>
                <TableCell>{c.total_enviados} / {c.total_falhas}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {(c.status === "rascunho" || c.status === "aguardando_aprovacao") && (
                    <Button size="sm" variant="outline" onClick={() => { setEditing(c); setOpen(true); }}>Editar</Button>
                  )}
                  {(c.status === "aguardando_aprovacao" || c.status === "rascunho") && (
                    <Button size="sm" onClick={() => setAprovar(c)}>
                      <Send className="h-3 w-3 mr-1" /> Aprovar e enviar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <CampanhaDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        editing={editing}
        onSaved={() => { setOpen(false); setEditing(null); load(); }}
      />

      <AlertDialog open={!!aprovar} onOpenChange={(o) => !o && setAprovar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar e enviar campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              "{aprovar?.assunto}" será enviada para todos os inscritos ativos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleAprovar(); }}
              disabled={working}
            >
              {working ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Enviando…</> : "Aprovar e enviar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CampanhaDialog({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  editing: Campanha | null; onSaved: () => void;
}) {
  const [assunto, setAssunto] = useState("");
  const [manchete, setManchete] = useState("");
  const [corpo, setCorpo] = useState("");
  const [selecionados, setSelecionados] = useState<Imovel[]>([]);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Imovel[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAssunto(editing?.assunto ?? "");
    setManchete(editing?.manchete ?? "");
    setCorpo(editing?.corpo ?? "");
    setBusca("");
    setResultados([]);
    if (editing?.imoveis_ids?.length) {
      supabase.from("imoveis").select("id,titulo,cidade,bairro,valor,fotos,codigo")
        .in("id", editing.imoveis_ids)
        .then(({ data }) => {
          const map = new Map((data ?? []).map((d: any) => [d.id, d]));
          setSelecionados(editing.imoveis_ids.map((id) => map.get(id)).filter(Boolean) as Imovel[]);
        });
    } else setSelecionados([]);
  }, [open, editing]);

  useEffect(() => {
    if (!busca.trim()) { setResultados([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("imoveis")
        .select("id,titulo,cidade,bairro,valor,fotos,codigo")
        .or(`titulo.ilike.%${busca}%,codigo.ilike.%${busca}%,bairro.ilike.%${busca}%`)
        .limit(8);
      setResultados((data ?? []) as Imovel[]);
    }, 250);
    return () => clearTimeout(t);
  }, [busca]);

  const add = (im: Imovel) => {
    if (selecionados.length >= 6) return toast.error("Máximo 6 imóveis");
    if (selecionados.some((s) => s.id === im.id)) return;
    setSelecionados([...selecionados, im]);
    setBusca(""); setResultados([]);
  };
  const remove = (id: string) => setSelecionados(selecionados.filter((s) => s.id !== id));

  const salvar = async (enviarParaAprovacao: boolean) => {
    if (!assunto.trim()) return toast.error("Informe o assunto");
    setSaving(true);
    const payload = {
      assunto: assunto.trim(),
      manchete: manchete.trim() || null,
      corpo: corpo.trim() || null,
      imoveis_ids: selecionados.map((s) => s.id),
      status: enviarParaAprovacao ? "aguardando_aprovacao" : "rascunho",
    };
    let campanhaId = editing?.id;
    if (editing) {
      const { error } = await supabase.from("newsletter_campanhas").update(payload).eq("id", editing.id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("newsletter_campanhas")
        .insert({ ...payload, criada_por: user?.id })
        .select("id").maybeSingle();
      if (error) { setSaving(false); return toast.error(error.message); }
      campanhaId = data?.id;
    }
    if (enviarParaAprovacao && campanhaId) {
      const { error } = await supabase.functions.invoke("newsletter-request-approval", {
        body: { campanha_id: campanhaId },
      });
      if (error) toast.error("Salvo, mas falhou avisar admins: " + error.message);
      else toast.success("Enviado para aprovação");
    } else {
      toast.success("Rascunho salvo");
    }
    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar campanha" : "Nova campanha"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Assunto do e-mail *</Label>
            <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Ex: Destaques da semana — HR Imóveis" />
          </div>
          <div>
            <Label>Manchete</Label>
            <Input value={manchete} onChange={(e) => setManchete(e.target.value)} placeholder="Título principal do e-mail" />
          </div>
          <div>
            <Label>Texto sobre o mercado</Label>
            <Textarea rows={6} value={corpo} onChange={(e) => setCorpo(e.target.value)} placeholder="Escreva um parágrafo sobre o mercado, novidades, dicas…" />
          </div>

          <div>
            <Label>Imóveis em destaque (até 6)</Label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input className="pl-8" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por título, código ou bairro…" />
            </div>
            {resultados.length > 0 && (
              <Card className="mt-2 p-2 space-y-1">
                {resultados.map((im) => (
                  <button key={im.id} type="button"
                    className="w-full text-left p-2 hover:bg-accent rounded text-sm flex justify-between gap-2"
                    onClick={() => add(im)}>
                    <span>{im.titulo} <span className="text-muted-foreground">· {im.bairro ?? im.cidade ?? ""}</span></span>
                    <span className="text-muted-foreground">{im.codigo}</span>
                  </button>
                ))}
              </Card>
            )}
            {selecionados.length > 0 && (
              <div className="mt-2 space-y-1">
                {selecionados.map((im) => (
                  <div key={im.id} className="flex items-center justify-between bg-muted/40 px-3 py-2 rounded text-sm">
                    <span>{im.titulo} <span className="text-muted-foreground">· {im.bairro ?? im.cidade ?? ""}</span></span>
                    <Button size="icon" variant="ghost" onClick={() => remove(im.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => salvar(false)} disabled={saving}>Salvar rascunho</Button>
          <Button onClick={() => salvar(true)} disabled={saving}>
            {saving ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />…</> : "Enviar para aprovação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
