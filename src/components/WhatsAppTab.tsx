import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Search, MessageCircle, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  phone: string;
  contact_name: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  content: string | null;
  status: string;
  timestamp: string;
}

function formatPhone(p: string) {
  const d = p.replace(/\D/g, "");
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return p;
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function WhatsAppTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPhone, setNewPhone] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carregar conversas
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) toast.error("Erro ao carregar conversas");
      setConversations((data as Conversation[]) ?? []);
      setLoading(false);
    })();

    const channel = supabase
      .channel("wa-conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_conversations" }, (payload) => {
        setConversations((prev) => {
          const row = payload.new as Conversation;
          if (payload.eventType === "DELETE") return prev.filter((c) => c.id !== (payload.old as any).id);
          const others = prev.filter((c) => c.id !== row.id);
          return [row, ...others].sort((a, b) =>
            new Date(b.last_message_at ?? 0).getTime() - new Date(a.last_message_at ?? 0).getTime()
          );
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Carregar mensagens da conversa ativa + realtime
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    (async () => {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", activeId)
        .order("timestamp", { ascending: true });
      setMessages((data as Message[]) ?? []);
      // zerar não-lidas
      await supabase.from("whatsapp_conversations").update({ unread_count: 0 }).eq("id", activeId);
    })();

    const ch = supabase
      .channel(`wa-msgs-${activeId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "whatsapp_messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return conversations.filter((c) =>
      !q || (c.contact_name ?? "").toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [conversations, search]);

  async function enviar() {
    if (!draft.trim()) return;
    const phone = active?.phone ?? newPhone.replace(/\D/g, "");
    if (!phone) { toast.error("Selecione uma conversa ou informe um número"); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-send", {
        body: { phone, message: draft, conversation_id: active?.id },
      });
      if (error) throw error;
      setDraft("");
      if (!active && data?.conversation_id) setActiveId(data.conversation_id);
      toast.success("Mensagem enviada");
    } catch (e: any) {
      toast.error(e.message || "Falha ao enviar");
    } finally {
      setSending(false);
    }
  }

  async function iniciarNova() {
    const clean = newPhone.replace(/\D/g, "");
    if (clean.length < 10) { toast.error("Informe um número válido com DDD"); return; }
    const { data: existing } = await supabase
      .from("whatsapp_conversations").select("*").eq("phone", clean).maybeSingle();
    if (existing) {
      setActiveId(existing.id);
    } else {
      const { data: created } = await supabase
        .from("whatsapp_conversations")
        .insert({ phone: clean, last_message_preview: "" })
        .select("*").single();
      if (created) {
        setConversations((p) => [created as Conversation, ...p]);
        setActiveId(created.id);
      }
    }
    setNewPhone("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold font-display">WhatsApp</h2>
        <p className="text-sm text-muted-foreground">Conversas integradas via Evolution API</p>
      </div>

      <Card className="overflow-hidden border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] h-[calc(100vh-220px)] min-h-[500px]">
          {/* Sidebar de conversas */}
          <div className="border-r border-border/50 flex flex-col bg-card/30">
            <div className="p-3 space-y-2 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contato ou número"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Novo: 5566999990000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button size="sm" className="h-9" onClick={iniciarNova}>
                  <Phone className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-6 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  Nenhuma conversa ainda.
                  <p className="text-xs mt-1">Aguarde mensagens chegarem ou inicie uma nova acima.</p>
                </div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition border-b border-border/30 text-left",
                      activeId === c.id && "bg-accent"
                    )}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary/15 text-primary text-sm">
                        {(c.contact_name || c.phone).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {c.contact_name || formatPhone(c.phone)}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {formatTime(c.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {c.last_message_preview || "—"}
                        </p>
                        {c.unread_count > 0 && (
                          <Badge className="h-4 min-w-4 px-1 text-[10px] bg-green-500 text-white">
                            {c.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Painel de conversa */}
          <div className="flex flex-col bg-background">
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 p-6">
                <MessageCircle className="h-12 w-12 opacity-30" />
                <p className="text-sm">Selecione uma conversa para começar</p>
                <p className="text-xs opacity-70 text-center max-w-sm">
                  Mensagens recebidas via Evolution API aparecem aqui em tempo real.
                  Configure o webhook em <code className="bg-muted px-1 rounded">messages.upsert</code> apontando para a função <code className="bg-muted px-1 rounded">whatsapp-webhook</code>.
                </p>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3 bg-card/30">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs">
                      {(active.contact_name || active.phone).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {active.contact_name || formatPhone(active.phone)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatPhone(active.phone)}</p>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
                  <div className="space-y-2">
                    {messages.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-8">
                        Nenhuma mensagem ainda.
                      </p>
                    )}
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          "flex",
                          m.direction === "outbound" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                            m.direction === "outbound"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted rounded-bl-sm"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className={cn(
                            "text-[10px] mt-1 opacity-70 text-right",
                          )}>
                            {new Date(m.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="p-3 border-t border-border/50 flex gap-2 bg-card/30">
                  <Input
                    placeholder="Digite uma mensagem…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                    disabled={sending}
                  />
                  <Button onClick={enviar} disabled={sending || !draft.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
