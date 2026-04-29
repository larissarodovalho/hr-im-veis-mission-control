import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CheckCircle2, AlertCircle, Phone, Video, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Kind = "videochamada" | "presencial" | "ligacao";

interface InfoResponse {
  nome?: string;
  kind?: Kind;
  duracao_min?: number;
  slots?: string[];
  used?: boolean;
  expired?: boolean;
  error?: string;
  reuniao_id?: string;
}

const kindMeta: Record<Kind, { label: string; icon: typeof Phone }> = {
  videochamada: { label: "Videochamada", icon: Video },
  presencial: { label: "Reunião presencial", icon: Users },
  ligacao: { label: "Ligação", icon: Phone },
};

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long", day: "2-digit", month: "long",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit", minute: "2-digit",
  });
}
function dayKey(iso: string) {
  // chave YYYY-MM-DD no fuso SP
  const d = new Date(iso);
  const sp = new Date(d.getTime() - 180 * 60 * 1000);
  return sp.toISOString().slice(0, 10);
}

export default function AgendarPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState<{ datetime_iso: string; kind: Kind } | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("booking-info", {
          method: "GET" as any,
          // edge function lê via querystring, então usamos invoke com path query
        });
        // fallback usando fetch direto, pois invoke não passa query bem
        if (error || !data) throw error;
        setInfo(data as InfoResponse);
      } catch {
        // Fallback explícito via fetch
        try {
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/booking-info?token=${encodeURIComponent(token)}`;
          const res = await fetch(url, {
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          });
          const data = await res.json();
          setInfo(data);
        } catch (e: any) {
          setInfo({ error: e?.message || "Falha ao carregar" });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of info?.slots ?? []) {
      const k = dayKey(s);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    }
    return map;
  }, [info?.slots]);

  const availableDays = useMemo(() => Array.from(slotsByDay.keys()).sort(), [slotsByDay]);

  // Auto-seleciona primeiro dia disponível
  useEffect(() => {
    if (!selectedDay && availableDays.length > 0) {
      const [y, m, d] = availableDays[0].split("-").map(Number);
      setSelectedDay(new Date(y, m - 1, d));
    }
  }, [availableDays, selectedDay]);

  const selectedDayKey = selectedDay
    ? `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`
    : "";
  const slotsForDay = slotsByDay.get(selectedDayKey) ?? [];

  async function confirmar() {
    if (!token || !selectedSlot) return;
    setConfirming(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/booking-confirm`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ token, datetime_iso: selectedSlot }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.conflict) {
          toast.error("Esse horário acabou de ser ocupado. Escolha outro.");
          // recarrega info
          setInfo(null);
          setLoading(true);
          const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/booking-info?token=${encodeURIComponent(token)}`, {
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          });
          setInfo(await r.json());
          setSelectedSlot(null);
          setLoading(false);
        } else {
          toast.error(data?.error || "Falha ao confirmar");
        }
        return;
      }
      setConfirmed({ datetime_iso: data.datetime_iso, kind: data.kind });
    } catch (e: any) {
      toast.error(e?.message || "Erro ao confirmar");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <Wrapper>
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando…
        </div>
      </Wrapper>
    );
  }

  if (info?.used && !confirmed) {
    return (
      <Wrapper>
        <Status icon={CheckCircle2} title="Agendamento já confirmado" tone="success">
          Este link já foi usado. Se precisar reagendar, é só falar com a Sofia no WhatsApp.
        </Status>
      </Wrapper>
    );
  }

  if (info?.expired || (info?.error && !confirmed)) {
    return (
      <Wrapper>
        <Status icon={AlertCircle} title={info.expired ? "Link expirado" : "Link inválido"} tone="error">
          {info.expired
            ? "Este link de agendamento expirou. Fale com a Sofia no WhatsApp para receber um novo."
            : "Não conseguimos abrir esse agendamento. Verifique o link ou peça um novo no WhatsApp."}
        </Status>
      </Wrapper>
    );
  }

  if (confirmed) {
    const Icon = kindMeta[confirmed.kind].icon;
    return (
      <Wrapper>
        <Status icon={CheckCircle2} title="Tudo certo!" tone="success">
          Sua <strong>{kindMeta[confirmed.kind].label.toLowerCase()}</strong> com o Hans está marcada para{" "}
          <strong>{fmtDay(confirmed.datetime_iso)} às {fmtTime(confirmed.datetime_iso)}</strong>.
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm">
            <Icon className="h-4 w-4" /> {kindMeta[confirmed.kind].label}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Enviamos a confirmação no seu WhatsApp. Até breve!
          </p>
        </Status>
      </Wrapper>
    );
  }

  const kind = info?.kind as Kind | undefined;
  const Icon = kind ? kindMeta[kind].icon : Phone;

  return (
    <Wrapper>
      <Card className="p-6 md:p-8 space-y-6">
        <header className="space-y-2">
          <Badge variant="secondary" className="gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            {kind ? kindMeta[kind].label : "Agendamento"}
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold font-display">
            {info?.nome ? `Olá, ${info.nome.split(" ")[0]}!` : "Agende com o Hans"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Escolha o dia e horário que ficam melhor para você. A {kind ? kindMeta[kind].label.toLowerCase() : "reunião"} dura {info?.duracao_min} minutos.
          </p>
        </header>

        {availableDays.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Sem horários disponíveis nos próximos dias. Fale com a Sofia no WhatsApp para alternativas.
          </p>
        ) : (
          <div className="grid md:grid-cols-[auto_1fr] gap-6">
            <div className="rounded-lg border bg-card p-2">
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={(d) => { setSelectedDay(d); setSelectedSlot(null); }}
                disabled={(date) => {
                  const k = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                  return !slotsByDay.has(k);
                }}
                className={cn("p-3 pointer-events-auto")}
              />
            </div>

            <div className="space-y-3 min-w-0">
              <p className="text-sm font-medium">
                {selectedDay
                  ? selectedDay.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
                  : "Selecione um dia"}
              </p>
              {slotsForDay.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem horários neste dia.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slotsForDay.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSlot(s)}
                      className={cn(
                        "rounded-lg border px-2 py-2.5 text-sm transition hover:border-primary",
                        selectedSlot === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card"
                      )}
                    >
                      {fmtTime(s)}
                    </button>
                  ))}
                </div>
              )}

              <Button
                className="w-full mt-4"
                size="lg"
                disabled={!selectedSlot || confirming}
                onClick={confirmar}
              >
                {confirming ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirmando…</>
                ) : selectedSlot ? (
                  <>Confirmar {fmtDay(selectedSlot)} às {fmtTime(selectedSlot)}</>
                ) : (
                  "Selecione um horário"
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
      <p className="text-xs text-center text-muted-foreground mt-6">
        HR Imóveis · Hans Rodovalho · Sinop-MT
      </p>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 py-8 md:py-16">
      <div className="max-w-3xl mx-auto">{children}</div>
    </main>
  );
}

function Status({
  icon: Icon, title, children, tone,
}: {
  icon: typeof CheckCircle2; title: string; children: React.ReactNode; tone: "success" | "error";
}) {
  return (
    <Card className="p-8 md:p-12 text-center space-y-4">
      <div className={cn(
        "inline-flex h-14 w-14 items-center justify-center rounded-full mx-auto",
        tone === "success" ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/15 text-destructive"
      )}>
        <Icon className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold font-display">{title}</h1>
      <div className="text-muted-foreground text-sm">{children}</div>
    </Card>
  );
}
