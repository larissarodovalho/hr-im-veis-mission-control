import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import { initials } from "@/lib/leads";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type Conv = { id: string; phone: string; contact_name: string | null; last_message_at: string | null; lead_id: string | null };
type Msg = { id: string; conversation_id: string; direction: string; content: string | null; created_at: string };

export default function WhatsApp() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<Conv | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase.from("whatsapp_conversations").select("id, phone, contact_name, last_message_at, lead_id").order("last_message_at", { ascending: false, nullsFirst: false });
    setConvs((data as any) ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("wa-convs").on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_conversations" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!active) { setMsgs([]); return; }
    supabase.from("whatsapp_messages").select("*").eq("conversation_id", active.id).order("created_at").then(({ data }) => setMsgs((data as any) ?? []));
    const ch = supabase.channel("wa-msgs-" + active.id).on("postgres_changes", { event: "INSERT", schema: "public", table: "whatsapp_messages", filter: `conversation_id=eq.${active.id}` }, p => {
      setMsgs(m => [...m, p.new as Msg]);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!active || !text.trim()) return;
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("whatsapp_messages").insert({
      conversation_id: active.id, direction: "outbound", content, status: "sent",
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className={"w-full md:w-80 border-r bg-card flex-col min-h-0 " + (active ? "hidden md:flex" : "flex")}>
        <div className="p-4 border-b">
          <h2 className="font-display text-xl font-semibold">WhatsApp</h2>
          <p className="text-xs text-muted-foreground">{convs.length} conversas</p>
        </div>
        <div className="flex-1 overflow-auto">
          {convs.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhuma conversa.</p>}
          {convs.map(c => {
            const name = c.contact_name || c.phone;
            return (
              <button key={c.id} onClick={() => setActive(c)} className={"w-full text-left p-3 border-b hover:bg-muted/50 " + (active?.id === c.id ? "bg-muted" : "")}>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold">{initials(name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.phone}</div>
                  </div>
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
            <div className="p-3 md:p-4 border-b flex items-center gap-2 bg-card">
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setActive(null)}><ArrowLeft className="h-4 w-4" /></Button>
              <div className="min-w-0">
                <div className="font-medium truncate">{active.contact_name || active.phone}</div>
                {active.contact_name && <div className="text-xs text-muted-foreground">{active.phone}</div>}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-3 md:p-4 space-y-2 bg-muted/20">
              {msgs.map(m => (
                <div key={m.id} className={"flex " + (m.direction === "outbound" ? "justify-end" : "justify-start")}>
                  <div className={"max-w-[85%] md:max-w-md rounded-2xl px-3 py-2 text-sm break-words " + (m.direction === "outbound" ? "bg-primary text-primary-foreground" : "bg-card border")}>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div className="text-[10px] opacity-60 mt-1">{format(new Date(m.created_at), "Pp", { locale: ptBR })}</div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="p-2 md:p-3 border-t bg-card flex gap-2">
              <Input value={text} onChange={e => setText(e.target.value)} placeholder="Digite uma mensagem" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
              <Button onClick={send}><Send className="h-4 w-4" /></Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
