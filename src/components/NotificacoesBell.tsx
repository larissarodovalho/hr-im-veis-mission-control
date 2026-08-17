// Sino de notificações do CRM (Etapa 14): primeiro acesso, feedback, expiração e indisponibilidade.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fmtDateTime } from "@/lib/datetime";
import { toast } from "sonner";
import {
  carregarPrefs, destinoNotificacao, excluirNotificacao, listarNotificacoes,
  marcarLida, marcarTodasLidas, salvarPrefs, PREF_LABEL, PREFS_PADRAO,
  type Notificacao, type NotificacaoPrefs,
} from "@/lib/notificacoes";

export default function NotificacoesBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [prefs, setPrefs] = useState<NotificacaoPrefs>(PREFS_PADRAO);
  const [verPrefs, setVerPrefs] = useState(false);

  const naoLidas = itens.filter((n) => !n.lida_em).length;

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      setItens(await listarNotificacoes(user.id));
    } catch { /* silencioso */ }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Realtime: novas notificações do próprio usuário
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`notificacoes:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificacoes", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as unknown as Notificacao;
          setItens((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]));
          toast(n.titulo, { description: n.descricao ?? undefined });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  useEffect(() => {
    if (aberto && user?.id) carregarPrefs(user.id).then(setPrefs).catch(() => {});
  }, [aberto, user?.id]);

  const abrir = async (n: Notificacao) => {
    if (!n.lida_em) {
      setItens((p) => p.map((x) => (x.id === n.id ? { ...x, lida_em: new Date().toISOString() } : x)));
      marcarLida(n.id).catch(() => {});
    }
    setAberto(false);
    navigate(destinoNotificacao(n));
  };

  const togglePref = async (chave: keyof NotificacaoPrefs, valor: boolean) => {
    if (!user?.id) return;
    const next = { ...prefs, [chave]: valor };
    setPrefs(next);
    try { await salvarPrefs(user.id, next); } catch { toast.error("Não foi possível salvar a preferência"); }
  };

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center px-1 text-[10px]">
              {naoLidas > 9 ? "9+" : naoLidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,24rem)] p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-medium">Notificações</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon" className="h-7 w-7" aria-label="Marcar todas como lidas"
              onClick={async () => {
                if (!user?.id) return;
                const agora = new Date().toISOString();
                setItens((p) => p.map((n) => ({ ...n, lida_em: n.lida_em ?? agora })));
                await marcarTodasLidas(user.id);
              }}
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7" aria-label="Preferências de notificação"
              onClick={() => setVerPrefs((v) => !v)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Separator />

        {verPrefs && (
          <div className="space-y-3 px-3 py-3">
            {(Object.keys(PREF_LABEL) as (keyof NotificacaoPrefs)[]).map((k) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{PREF_LABEL[k]}</span>
                <Switch checked={prefs[k]} onCheckedChange={(v) => togglePref(k, v)} />
              </div>
            ))}
            <Separator />
          </div>
        )}

        <ScrollArea className="max-h-80">
          {itens.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação.</p>
          ) : (
            <ul className="divide-y">
              {itens.map((n) => (
                <li key={n.id} className={n.lida_em ? "" : "bg-muted/40"}>
                  <div className="flex items-start gap-2 px-3 py-2">
                    <button className="min-w-0 flex-1 text-left" onClick={() => abrir(n)}>
                      <p className="truncate text-sm font-medium">{n.titulo}</p>
                      {n.descricao && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.descricao}</p>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{fmtDateTime(n.created_at)}</p>
                    </button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Excluir notificação"
                      onClick={async () => {
                        setItens((p) => p.filter((x) => x.id !== n.id));
                        await excluirNotificacao(n.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
