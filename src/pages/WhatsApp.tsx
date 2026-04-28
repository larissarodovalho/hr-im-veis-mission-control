import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRole } from "@/hooks/useRole";
import { initials } from "@/lib/leads";
import { Send, Bot, User as UserIcon, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { markWhatsAppSeen } from "@/hooks/useWhatsAppUnread";
import { useWhatsAppPerConvUnread } from "@/hooks/useWhatsAppPerConvUnread";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Conv = {
  id: string;
  phone: string;
  contact_name: string | null;
  ai_enabled: boolean;
  last_message_at: string | null;
  lead_id: string | null;
  leads?: { nome: string | null } | null;
};
type Msg = {
  id: string;
  conversation_id: string;
  direction: string;
  author: string | null;
  content: string | null;
  created_at: string;
};

export default function WhatsApp() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<Conv | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useRole();
  const { unreadByConv, markConvSeen } = useWhatsAppPerConvUnread();
  const [editConv, setEditConv] = useState<{ phone: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const scrollToBottom = () => {
    const c = messagesContainerRef.current;
    if (c) c.scrollTop = c.scrollHeight;
  };

  useEffect(() => {
    if (msgs.length > 0) {
      requestAnimationFrame(scrollToBottom);
      setTimeout(scrollToBottom, 100);
    }
  }, [msgs, active?.id]);

  const loadConvs = async () => {
    const { data } = await supabase
      .from("whatsapp_conversations")
      .select("id, phone, contact_name, ai_enabled, last_message_at, lead_id, leads(nome)")
      .order("last_message_at", { ascending: false, nullsFirst: false });

    const nextConvs = (data as unknown as Conv[]) ?? [];
    setConvs(nextConvs);
    const wantedId = searchParams.get("conv");
    setActive((current) => {
      if (wantedId) {
        const found = nextConvs.find((c) => c.id === wantedId);
        if (found) return found;
      }
      return nextConvs.find((conv) => conv.id === current?.id) ?? current ?? null;
    });
  };

  useEffect(() => {
    loadConvs();
    const convsChannel = supabase
      .channel("wa-convs")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_conversations" }, loadConvs)
      .subscribe();
    const leadsChannel = supabase
      .channel("wa-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, loadConvs)
      .subscribe();
    return () => {
      supabase.removeChannel(convsChannel);
      supabase.removeChannel(leadsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wantedId = searchParams.get("conv");
    if (!wantedId) return;
    const found = convs.find((c) => c.id === wantedId);
    if (found && found.id !== active?.id) setActive(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, convs]);

  useEffect(() => { markWhatsAppSeen(); }, []);

  useEffect(() => {
    if (!active) { setMsgs([]); return; }
    markWhatsAppSeen();
    markConvSeen(active.id);

    (async () => {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", active.id)
        .order("created_at");
      setMsgs((data as unknown as Msg[]) ?? []);
    })();

    const ch = supabase.channel("wa-msgs-" + active.id).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "whatsapp_messages", filter: `conversation_id=eq.${active.id}` },
      (p) => {
        setMsgs((m) => [...m, p.new as Msg]);
        markWhatsAppSeen();
        markConvSeen(active.id);
      }
    ).subscribe();

    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const toggleAI = async (enabled: boolean) => {
    if (!active) return;
    await supabase.from("whatsapp_conversations").update({ ai_enabled: enabled }).eq("id", active.id);
    setActive({ ...active, ai_enabled: enabled });
    setConvs((items) => items.map((item) => item.id === active.id ? { ...item, ai_enabled: enabled } : item));
    toast.success(enabled ? "IA ativada para esta conversa" : "Atendimento humano assumido");
  };

  const send = async () => {
    if (!active) return;
    const content = text.trim();
    if (!content) return;
    setText("");
    const { data, error } = await supabase.functions.invoke("whatsapp-send", {
      body: { conversation_id: active.id, content },
    });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Erro ao enviar");
    }
  };

  const normalizePhone = (raw: string) => {
    const digits = (raw || "").replace(/\D/g, "");
    if (!digits) return "";
    return digits.startsWith("55") ? digits : `55${digits}`;
  };

  const saveEditConv = async () => {
    if (!active || !editConv) return;
    const phone = normalizePhone(editConv.phone);
    if (phone.length < 12) return toast.error("Telefone inválido");
    const { error } = await supabase.from("whatsapp_conversations").update({ phone }).eq("id", active.id);
    if (error) return toast.error(error.message);
    setActive({ ...active, phone });
    setConvs((items) => items.map((i) => i.id === active.id ? { ...i, phone } : i));
    setEditConv(null);
    toast.success("Conversa atualizada");
  };

  const deleteConv = async () => {
    if (!active) return;
    const id = active.id;
    const { error: msgErr } = await supabase.from("whatsapp_messages").delete().eq("conversation_id", id);
    if (msgErr) return toast.error(msgErr.message);
    const { error } = await supabase.from("whatsapp_conversations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setConfirmDelete(false);
    setActive(null);
    setConvs((items) => items.filter((i) => i.id !== id));
    if (searchParams.get("conv")) setSearchParams({});
    toast.success("Conversa excluída");
  };

  const activeLeadName = active?.leads?.nome?.trim() || active?.contact_name?.trim();
  const activeDisplayName = activeLeadName && !activeLeadName.startsWith("WhatsApp ") ? activeLeadName : active?.phone;

  const renderContent = (content: string) => {
    const parts = content.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, i) =>
      /^https?:\/\//.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all">{part}</a>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className={"w-full md:w-80 border-r bg-card flex-col min-h-0 " + (active ? "hidden md:flex" : "flex")}>
        <div className="p-4 border-b">
          <h2 className="font-display text-xl font-semibold">WhatsApp</h2>
          <p className="text-xs text-muted-foreground">{convs.length} conversas</p>
        </div>

        <div className="flex-1 overflow-auto">
          {convs.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              Nenhuma conversa ainda. Configure o webhook em Configurações.
            </p>
          )}

          {convs.map((c) => {
            const leadName = c.leads?.nome?.trim() || c.contact_name?.trim();
            const hasLeadName = !!leadName && !leadName.startsWith("WhatsApp ");
            const displayName = hasLeadName ? leadName! : c.phone;
            const unreadCount = !c.ai_enabled ? (unreadByConv[c.id] || 0) : 0;
            const hasUnread = unreadCount > 0;

            return (
              <button
                key={c.id}
                onClick={() => { setActive(c); markConvSeen(c.id); }}
                className={"w-full text-left p-3 border-b hover:bg-muted/50 " + (active?.id === c.id ? "bg-muted" : "")}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold">
                    {initials(displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={"text-sm truncate " + (hasUnread ? "font-semibold" : "font-medium")}>{displayName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {hasLeadName ? `${c.phone} · ${c.ai_enabled ? "IA" : "Humano"}` : c.ai_enabled ? "🤖 IA" : "👤 Humano"}
                    </div>
                  </div>
                  {hasUnread && (
                    <span className="ml-auto shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={"flex-1 flex-col min-w-0 " + (active ? "flex" : "hidden md:flex")}>
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">Selecione uma conversa</div>
        ) : (
          <>
            <div className="p-3 md:p-4 border-b flex items-center justify-between gap-2 bg-card">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-8 w-8" onClick={() => setActive(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <div className="font-medium truncate">{activeDisplayName}</div>
                  {activeLeadName && !activeLeadName.startsWith("WhatsApp ") && (
                    <div className="text-xs md:text-sm text-muted-foreground truncate">{active.phone}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm hidden sm:inline">IA</span>
                <Switch checked={active.ai_enabled} onCheckedChange={toggleAI} />
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar telefone" onClick={() => setEditConv({ phone: active.phone })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title="Excluir conversa"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div ref={messagesContainerRef} className="flex-1 overflow-auto p-3 md:p-4 space-y-2 bg-muted/20">
              {msgs.map((m) => (
                <div key={m.id} className={"flex " + (m.direction === "outbound" ? "justify-end" : "justify-start")}>
                  <div className={"max-w-[85%] md:max-w-md rounded-2xl px-3 py-2 text-sm break-words " + (m.direction === "outbound" ? "bg-primary text-primary-foreground" : "bg-card border")}>
                    <div className="flex items-center gap-1 text-[10px] opacity-70 mb-0.5">
                      {m.author === "ia" ? <Bot className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                      {m.author || "humano"}
                    </div>
                    <div className="whitespace-pre-wrap break-words">{renderContent(m.content || "")}</div>
                    <div className="text-[10px] opacity-60 mt-1">
                      {format(new Date(m.created_at), "Pp", { locale: ptBR })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-2 md:p-3 border-t bg-card flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={active.ai_enabled ? "IA está respondendo. Você pode intervir." : "Digite uma mensagem"}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
              <Button onClick={send} className="shrink-0"><Send className="h-4 w-4" /></Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={!!editConv} onOpenChange={(o) => !o && setEditConv(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar conversa</DialogTitle></DialogHeader>
          {editConv && (
            <div className="space-y-3">
              <div>
                <Label>Telefone (com DDD)</Label>
                <Input
                  value={editConv.phone}
                  onChange={(e) => setEditConv({ phone: e.target.value })}
                  placeholder="5511999999999"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O código do país (55) será adicionado automaticamente se faltar.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditConv(null)}>Cancelar</Button>
            <Button onClick={saveEditConv}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove a conversa e todas as mensagens. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteConv}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
