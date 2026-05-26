import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, RefreshCw, Unlink, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Conn = {
  google_email: string;
  connected_at: string;
  last_sync_at: string | null;
  last_sync_error: string | null;
  calendar_id: string;
};

const activationUrlFromError = (message: string) =>
  message.match(/https:\/\/console\.developers\.google\.com\/apis\/api\/calendar-json\.googleapis\.com\/overview\?project=[^\s]+/)?.[0];

export default function GoogleCalendarConnect() {
  const { user } = useAuth();
  const [conn, setConn] = useState<Conn | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("user_google_calendar")
      .select("google_email, connected_at, last_sync_at, last_sync_error, calendar_id")
      .eq("user_id", user.id)
      .maybeSingle();
    setConn((data as Conn) ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  // recebe postMessage da janela do OAuth (caso o popup mantenha opener)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.source === "google-oauth") {
        if (e.data.ok) { toast.success(e.data.message || "Conectado!"); load(); }
        else toast.error(e.data.message || "Falha ao conectar");
      }
    };
    const onFocus = () => { load(); };
    window.addEventListener("message", handler);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("message", handler);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const connect = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-oauth-start");
      if (error) throw error;
      if ((data as any)?.setupRequired) {
        toast.error((data as any).error || "Configuração do Google Calendar pendente.");
        return;
      }
      const url = (data as any)?.url;
      if (!url) throw new Error("URL não recebida");
      // Abre em nova aba como contexto top-level (noopener) para evitar COOP/COEP do iframe da preview
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        // Fallback: navega a janela topo
        try { (window.top || window).location.href = url; }
        catch { window.location.href = url; }
      } else {
        toast.info("Conclua o login do Google na nova aba. Volte aqui em seguida.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const disconnect = async () => {
    if (!confirm("Desconectar sua conta Google? Os eventos já criados na sua agenda não serão removidos.")) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("google-oauth-disconnect");
      if (error) throw error;
      toast.success("Desconectado");
      setConn(null);
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const syncNow = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("gcal-pull", { body: { user_id: user.id } });
      if (error) throw error;
      toast.success("Sincronizado");
      load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Google Calendar
          {conn && <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Conectado</Badge>}
        </CardTitle>
        <CardDescription>
          Conecte sua conta Google. Compromissos do CRM em que você é responsável aparecem na sua agenda pessoal automaticamente — e eventos que você criar no Google passam a aparecer pra você dentro do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : conn ? (
          <div className="space-y-3">
            <div className="rounded-lg border p-3 text-sm space-y-1">
              <p><strong>E-mail:</strong> {conn.google_email}</p>
              <p className="text-xs text-muted-foreground">
                Conectado em {new Date(conn.connected_at).toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">
                Última sincronização: {conn.last_sync_at ? new Date(conn.last_sync_at).toLocaleString("pt-BR") : "—"}
              </p>
              {conn.last_sync_error && (
                <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <p>{conn.last_sync_error}</p>
                  {activationUrlFromError(conn.last_sync_error) && (
                    <Button size="sm" variant="outline" asChild className="h-8">
                      <a href={activationUrlFromError(conn.last_sync_error)} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" /> Ativar Google Calendar API
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={syncNow} disabled={busy}>
                <RefreshCw className={`h-4 w-4 mr-1 ${busy ? "animate-spin" : ""}`} /> Sincronizar agora
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="https://calendar.google.com" target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" /> Abrir Google Calendar
                </a>
              </Button>
              <Button size="sm" variant="destructive" onClick={disconnect} disabled={busy}>
                <Unlink className="h-4 w-4 mr-1" /> Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={connect} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
            Conectar minha conta Google
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
