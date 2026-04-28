import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShieldAlert, Settings, Building2, MessageCircle, Bell, Database, ExternalLink,
  Loader2, QrCode, RefreshCw, LogOut, Send, CheckCircle2, XCircle, AlertCircle, Copy,
  Webhook, Bot, Globe, Check, ShieldCheck, History, Trash2, HardDrive,
} from "lucide-react";
import { Link } from "react-router-dom";
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
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="empresa"><Building2 className="h-4 w-4 mr-1" />Empresa</TabsTrigger>
          <TabsTrigger value="whatsapp"><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</TabsTrigger>
          <TabsTrigger value="integracoes"><Webhook className="h-4 w-4 mr-1" />Integrações & IA</TabsTrigger>
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
          <WhatsAppConnection webhookUrl={webhookUrl} />
        </TabsContent>

        <TabsContent value="integracoes">
          <IntegracoesIA />
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

// =================== WhatsApp Connection (Evolution) ===================

type ConnState = "open" | "connecting" | "close" | "unknown";

function WhatsAppConnection({ webhookUrl }: { webhookUrl: string }) {
  const [state, setState] = useState<ConnState>("unknown");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [webhookActive, setWebhookActive] = useState<boolean | null>(null);
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("Olá! Esta é uma mensagem de teste do CRM HR Imóveis.");
  const [sending, setSending] = useState(false);

  async function call(action: string) {
    const { data, error } = await supabase.functions.invoke("whatsapp-instance", {
      body: { action },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as { ok: boolean; data: any; webhookUrl: string };
  }

  async function refreshStatus() {
    setLoadingStatus(true);
    try {
      const r = await call("status");
      const s = (r.data?.instance?.state || r.data?.state || "unknown") as ConnState;
      setState(s);
      if (s === "open") setQrcode(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingStatus(false);
    }
  }

  async function refreshWebhook() {
    try {
      const r = await call("find-webhook");
      const enabled = !!(r.data?.enabled ?? r.data?.webhook?.enabled);
      const url = r.data?.url ?? r.data?.webhook?.url ?? "";
      setWebhookActive(enabled && url === webhookUrl);
    } catch {
      setWebhookActive(false);
    }
  }

  useEffect(() => {
    refreshStatus();
    refreshWebhook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // poll enquanto QR está aberto
  useEffect(() => {
    if (!qrcode) return;
    const id = setInterval(async () => {
      try {
        const r = await call("status");
        const s = (r.data?.instance?.state || r.data?.state || "unknown") as ConnState;
        setState(s);
        if (s === "open") {
          setQrcode(null);
          toast.success("WhatsApp conectado!");
        }
      } catch {/* ignore */}
    }, 5000);
    return () => clearInterval(id);
  }, [qrcode]);

  async function generateQr() {
    setLoadingQr(true);
    setQrcode(null);
    try {
      const r = await call("qrcode");
      const base64 = r.data?.base64 || r.data?.qrcode?.base64 || r.data?.code || null;
      if (!base64) {
        await refreshStatus();
        if (state === "open") toast.info("WhatsApp já está conectado");
        else toast.error("Não foi possível obter o QR Code");
        return;
      }
      setQrcode(base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingQr(false);
    }
  }

  async function setWebhook() {
    setSettingWebhook(true);
    try {
      await call("set-webhook");
      toast.success("Webhook configurado na Evolution");
      await refreshWebhook();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSettingWebhook(false);
    }
  }

  async function restart() {
    setRestarting(true);
    try {
      await call("restart");
      toast.success("Instância reiniciada");
      setTimeout(refreshStatus, 1500);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRestarting(false);
    }
  }

  async function logout() {
    if (!confirm("Desconectar o WhatsApp? Será necessário escanear o QR Code novamente.")) return;
    setLoggingOut(true);
    try {
      await call("logout");
      toast.success("WhatsApp desconectado");
      setState("close");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoggingOut(false);
    }
  }

  async function sendTest() {
    if (!testPhone.trim() || !testMsg.trim()) {
      toast.error("Preencha telefone e mensagem");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-send", {
        body: { phone: testPhone.replace(/\D/g, ""), content: testMsg },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Mensagem de teste enviada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  const stateInfo = {
    open: { label: "Conectada", color: "bg-emerald-500", icon: CheckCircle2 },
    connecting: { label: "Aguardando QR Code", color: "bg-amber-500", icon: AlertCircle },
    close: { label: "Desconectada", color: "bg-rose-500", icon: XCircle },
    unknown: { label: "Status desconhecido", color: "bg-muted-foreground", icon: AlertCircle },
  }[state];
  const StateIcon = stateInfo.icon;

  return (
    <div className="space-y-4">
      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> Status da instância Evolution
          </CardTitle>
          <CardDescription>Estado atual da conexão do número WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${stateInfo.color}`} />
              <div>
                <p className="font-medium flex items-center gap-2">
                  <StateIcon className="h-4 w-4" /> {stateInfo.label}
                </p>
                <p className="text-xs text-muted-foreground">Instância configurada via secret no backend</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refreshStatus} disabled={loadingStatus}>
              {loadingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1">Atualizar</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={restart} disabled={restarting}>
              {restarting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Reiniciar instância
            </Button>
            <Button variant="outline" size="sm" onClick={logout} disabled={loggingOut || state !== "open"}>
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <LogOut className="h-4 w-4 mr-1" />}
              Desconectar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Conectar número (QR Code)</CardTitle>
          <CardDescription>Escaneie com o WhatsApp do celular para parear o número</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {state === "open" ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> WhatsApp já está conectado
              </p>
              <p className="text-muted-foreground mt-1">Para trocar de número, clique em "Desconectar" acima.</p>
            </div>
          ) : (
            <>
              <Button onClick={generateQr} disabled={loadingQr}>
                {loadingQr ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <QrCode className="h-4 w-4 mr-1" />}
                Gerar QR Code
              </Button>
              {qrcode && (
                <div className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-card">
                  <img src={qrcode} alt="QR Code WhatsApp" className="w-64 h-64" />
                  <ol className="text-sm text-muted-foreground space-y-1 max-w-md">
                    <li>1. Abra o WhatsApp no celular</li>
                    <li>2. Toque em <strong>Aparelhos conectados</strong></li>
                    <li>3. <strong>Conectar um aparelho</strong> e escaneie o código</li>
                  </ol>
                  <p className="text-xs text-muted-foreground">Status atualiza automaticamente a cada 5 segundos…</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook de mensagens recebidas</CardTitle>
          <CardDescription>Permite que a Evolution envie as mensagens recebidas para o CRM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>URL do webhook</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("URL copiada"); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              {webhookActive === null ? (
                <Badge variant="secondary">Verificando…</Badge>
              ) : webhookActive ? (
                <Badge className="bg-emerald-500 hover:bg-emerald-500"><CheckCircle2 className="h-3 w-3 mr-1" />Webhook ativo</Badge>
              ) : (
                <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Não configurado</Badge>
              )}
              <span className="text-xs text-muted-foreground">Eventos: MESSAGES_UPSERT, CONNECTION_UPDATE</span>
            </div>
            <Button size="sm" onClick={setWebhook} disabled={settingWebhook}>
              {settingWebhook ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Configurar webhook na Evolution
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test send */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" /> Testar envio</CardTitle>
          <CardDescription>Envie uma mensagem para confirmar que tudo funciona</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Telefone (com DDD)</Label>
              <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="11987654321" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Mensagem</Label>
              <Textarea value={testMsg} onChange={(e) => setTestMsg(e.target.value)} rows={2} />
            </div>
          </div>
          <Button onClick={sendTest} disabled={sending || state !== "open"}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
            Enviar teste
          </Button>
          {state !== "open" && (
            <p className="text-xs text-muted-foreground">Conecte o WhatsApp acima antes de testar o envio.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// =================== Integrações & IA ===================

function IntegracoesIA() {
  const projectUrl = import.meta.env.VITE_SUPABASE_URL || "https://pbqiwdwwabvjmybbatdv.supabase.co";
  const webhookLead = `${projectUrl}/functions/v1/lead-webhook`;
  const landingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/captura`;
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (s: string, k: string) => {
    navigator.clipboard.writeText(s);
    setCopied(k);
    toast.success("Copiado");
    setTimeout(() => setCopied(null), 2000);
  };

  const jsonExample = `{ "full_name": "...", "phone": "...", "email": "...", "source": "meta_ads", "interest": "compra", "region": "MT", "notes": "..." }`;

  return (
    <div className="space-y-4">
      {/* Webhook leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" /> Webhook de captação de leads
          </CardTitle>
          <CardDescription>
            Configure este endpoint no Meta Lead Ads, Google Ads ou em formulários externos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-muted p-3 flex items-center gap-2">
            <code className="text-xs flex-1 break-all">{webhookLead}</code>
            <Button size="sm" variant="ghost" onClick={() => copy(webhookLead, "lead")}>
              {copied === "lead" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Envie um <strong>POST</strong> com o seguinte JSON:</p>
            <code className="block bg-muted px-2 py-1.5 rounded font-mono text-[11px] break-all">
              {jsonExample}
            </code>
          </div>
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            <strong className="text-amber-600">Atenção:</strong> o endpoint <code>lead-webhook</code> precisa
            ser ativado. Peça ao Lovable: <em>"Ativar o webhook de captação de leads"</em>.
          </div>
        </CardContent>
      </Card>

      {/* IA conversacional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" /> IA conversacional
          </CardTitle>
          <CardDescription>
            A IA atende leads no WhatsApp quando o toggle "IA" está ativo na conversa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Modelo:</span>
            <Badge variant="secondary">google/gemini-3-flash-preview</Badge>
            <span className="text-xs text-muted-foreground">via Lovable AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Comportamento padrão: a IA qualifica leads, captura interesse, sugere imóveis e agenda
            visitas. Ao detectar intenção forte, transfere a conversa para um corretor humano
            (basta desativar o toggle "IA" da conversa em <strong>WhatsApp</strong>).
          </p>
          <p className="text-sm text-muted-foreground">
            Para personalizar o prompt da IA, peça ao Lovable: <em>"Editar o prompt da IA do WhatsApp"</em>.
          </p>
        </CardContent>
      </Card>

      {/* Landing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> Landing de captura
          </CardTitle>
          <CardDescription>
            URL pública para divulgar em anúncios e redes sociais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="rounded-lg bg-muted p-3 flex items-center gap-2">
            <code className="text-xs flex-1 break-all">{landingUrl}</code>
            <Button size="sm" variant="ghost" onClick={() => copy(landingUrl, "land")}>
              {copied === "land" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Os leads que chegarem por essa página entram diretamente no funil em <strong>"Novo Lead"</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

