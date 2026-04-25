import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldAlert, Settings, Building2, MessageCircle, Bell, Database, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "hr-system-settings";

type SystemSettings = {
  empresa_nome: string;
  empresa_email: string;
  empresa_telefone: string;
  empresa_cnpj: string;
  empresa_endereco: string;
  whatsapp_instancia: string;
  whatsapp_webhook_ativo: boolean;
  notif_novo_lead: boolean;
  notif_nova_mensagem: boolean;
  notif_tarefa_atrasada: boolean;
  fuso_horario: string;
  moeda: string;
};

const DEFAULTS: SystemSettings = {
  empresa_nome: "HR Imóveis",
  empresa_email: "",
  empresa_telefone: "",
  empresa_cnpj: "",
  empresa_endereco: "",
  whatsapp_instancia: "",
  whatsapp_webhook_ativo: true,
  notif_novo_lead: true,
  notif_nova_mensagem: true,
  notif_tarefa_atrasada: true,
  fuso_horario: "America/Sao_Paulo",
  moeda: "BRL",
};

export default function ConfiguracoesPage() {
  const { isAdmin } = useAuth();
  const [s, setS] = useState<SystemSettings>(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<{ leads: number; contatos: number; conversas: number; usuarios: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setS({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [l, c, w, u] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("contatos").select("id", { count: "exact", head: true }),
        supabase.from("whatsapp_conversations").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        leads: l.count ?? 0,
        contatos: c.count ?? 0,
        conversas: w.count ?? 0,
        usuarios: u.count ?? 0,
      });
    })();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <ShieldAlert className="h-10 w-10 mx-auto text-destructive" />
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>Apenas administradores podem acessar as configurações do sistema.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  function save() {
    setBusy(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      toast.success("Configurações salvas");
    } catch {
      toast.error("Falha ao salvar");
    } finally {
      setBusy(false);
    }
  }

  const webhookUrl = `https://pbqiwdwwabvjmybbatdv.supabase.co/functions/v1/whatsapp-webhook`;

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
          <p className="text-sm text-muted-foreground">Preferências globais — acesso administrativo</p>
        </div>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa"><Building2 className="h-4 w-4 mr-1" />Empresa</TabsTrigger>
          <TabsTrigger value="whatsapp"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</TabsTrigger>
          <TabsTrigger value="notificacoes"><Bell className="h-4 w-4 mr-1" />Notificações</TabsTrigger>
          <TabsTrigger value="sistema"><Database className="h-4 w-4 mr-1" />Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle>Dados da empresa</CardTitle>
              <CardDescription>Aparecem em propostas, emails e relatórios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nome da empresa</Label>
                  <Input value={s.empresa_nome} onChange={(e) => setS({ ...s, empresa_nome: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>CNPJ</Label>
                  <Input value={s.empresa_cnpj} onChange={(e) => setS({ ...s, empresa_cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={s.empresa_email} onChange={(e) => setS({ ...s, empresa_email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input value={s.empresa_telefone} onChange={(e) => setS({ ...s, empresa_telefone: e.target.value })} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Endereço</Label>
                  <Input value={s.empresa_endereco} onChange={(e) => setS({ ...s, empresa_endereco: e.target.value })} />
                </div>
              </div>
              <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>Integração WhatsApp (Evolution API)</CardTitle>
              <CardDescription>Configure o webhook na sua instância Evolution para receber mensagens em tempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome da instância</Label>
                <Input value={s.whatsapp_instancia} onChange={(e) => setS({ ...s, whatsapp_instancia: e.target.value })} placeholder="hr-imoveis" />
                <p className="text-xs text-muted-foreground">Apenas referência visual. A instância real é definida via secret no backend.</p>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <Label>URL do Webhook (cole na Evolution API)</Label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copiado"); }}>Copiar</Button>
                </div>
                <p className="text-xs text-muted-foreground">Eventos requeridos: <code className="bg-muted px-1 rounded">MESSAGES_UPSERT</code></p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Webhook ativo</Label>
                  <p className="text-xs text-muted-foreground">Habilita o recebimento automático de mensagens</p>
                </div>
                <Switch checked={s.whatsapp_webhook_ativo} onCheckedChange={(v) => setS({ ...s, whatsapp_webhook_ativo: v })} />
              </div>
              <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de notificação</CardTitle>
              <CardDescription>Eventos que disparam alertas para a equipe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "notif_novo_lead", label: "Novo lead recebido", desc: "Quando um lead chega via formulário ou integração" },
                { key: "notif_nova_mensagem", label: "Nova mensagem WhatsApp", desc: "Quando o cliente responde uma conversa" },
                { key: "notif_tarefa_atrasada", label: "Tarefa atrasada", desc: "Quando uma tarefa passa do prazo" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(s as any)[item.key]}
                    onCheckedChange={(v) => setS({ ...s, [item.key]: v } as SystemSettings)}
                  />
                </div>
              ))}
              <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Localização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Fuso horário</Label>
                    <Input value={s.fuso_horario} onChange={(e) => setS({ ...s, fuso_horario: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Moeda</Label>
                    <Input value={s.moeda} onChange={(e) => setS({ ...s, moeda: e.target.value })} />
                  </div>
                </div>
                <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas do banco</CardTitle>
                <CardDescription>Volume atual de dados no sistema</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats ? (
                  <>
                    <Stat label="Usuários" value={stats.usuarios} />
                    <Stat label="Leads" value={stats.leads} />
                    <Stat label="Contatos" value={stats.contatos} />
                    <Stat label="Conversas" value={stats.conversas} />
                  </>
                ) : (
                  <div className="col-span-4 flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backend</CardTitle>
                <CardDescription>Acesso à infraestrutura Lovable Cloud</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Logs de funções, secrets, banco de dados e auth</p>
                  <Badge variant="secondary" className="mt-1">Apenas administradores</Badge>
                </div>
                <Button variant="outline" asChild>
                  <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Acesse via menu Cloud no Lovable"); }}>
                    Abrir <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}
