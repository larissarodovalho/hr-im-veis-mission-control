import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string; bookingUrl?: string | null };

const HELLO = "Olá! Sou a Helena, assistente da HR Imóveis. Para começar, me diz seu nome completo?";

export default function CapturaPage() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: HELLO }]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });
      const data = await res.json();
      if (data.session_id) setSessionId(data.session_id);
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "…", bookingUrl: data.booking_url || null }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Tive um problema agora. Pode tentar novamente?" }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <header className="container py-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="font-display text-xl font-semibold">HR Imóveis · Atendimento</h1>
      </header>
      <main className="container max-w-2xl pb-10">
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="p-4 md:p-6 space-y-3 max-h-[65vh] overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}>
                  {m.content}
                  {m.bookingUrl && (
                    <a href={m.bookingUrl} target="_blank" rel="noopener noreferrer"
                       className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-background border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition">
                      Escolher horário <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-2.5 text-sm inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Digitando…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t p-3 flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva sua mensagem…"
              disabled={sending}
            />
            <Button type="submit" disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Atendimento automático por IA. Um corretor da HR Imóveis assume a conversa em seguida.
        </p>
      </main>
    </div>
  );
}
