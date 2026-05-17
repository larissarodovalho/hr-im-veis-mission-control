import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CheckCircle2, AlertCircle, Phone, Video, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import hrLogo from "@/assets/logo-hr-branco.png";

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
  datetime_iso?: string | null;
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
  const d = new Date(iso);
  const sp = new Date(d.getTime() - 180 * 60 * 1000);
  return sp.toISOString().slice(0, 10);
}

export default function AgendarPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [selectedKind, setSelectedKind] = useState<Kind | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState<{ datetime_iso: string; kind: Kind } | null>(null);

  async function fetchInfo(kindOverride?: Kind) {
    if (!token) return;
    try {
      const qs = new URLSearchParams({ token });
      if (kindOverride) qs.set("kind", kindOverride);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/booking-info?${qs.toString()}`;
      const res = await fetch(url, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      const text = await res.text();
      let data: InfoResponse = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
      if (!res.ok && !data?.error) {
        data.error = res.status === 410 ? "expirado" : res.status === 404 ? "não encontrado" : `falha ${res.status}`;
        if (res.status === 410) data.expired = true;
      }
      if (!res.ok && res.status >= 500) {
        data = { error: "Não foi possível carregar agora. Tente novamente em instantes." };
      }
      setInfo(data);
      if (data?.kind && !selectedKind) setSelectedKind(data.kind as Kind);
    } catch (e: any) {
      setInfo({ error: e?.message || "Falha ao carregar" });
    }
  }

  useEffect(() => {
    if (!token) return;
    (async () => {
      await fetchInfo();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Re-busca slots quando o usuário muda o tipo (durações diferentes)
  useEffect(() => {
    if (!selectedKind || !info || info.used || info.expired || info.error) return;
    if (selectedKind === info.kind) return;
    setSelectedSlot(null);
    fetchInfo(selectedKind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKind]);

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
        body: JSON.stringify({ token, datetime_iso: selectedSlot, kind: selectedKind || info?.kind }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.conflict) {
          toast.error("Esse horário acabou de ser ocupado. Escolha outro.");
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
        <div className="flex items-center justify-center py-20 gap-2 text-white/60">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando…
        </div>
      </Wrapper>
    );
  }

  if (info?.used && !confirmed) {
    if (info.datetime_iso && info.kind) {
      const Icon = kindMeta[info.kind].icon;
      return (
        <Wrapper>
          <Status icon={CheckCircle2} title="Tudo certo!" tone="success">
            Sua <strong className="text-white">{kindMeta[info.kind].label.toLowerCase()}</strong> com o Hans está marcada para{" "}
            <strong className="text-white">{fmtDay(info.datetime_iso)} às {fmtTime(info.datetime_iso)}</strong>.
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 text-white px-4 py-1.5 text-sm">
              <Icon className="h-4 w-4" /> {kindMeta[info.kind].label}
            </div>
            <p className="text-sm text-white/50 mt-5">
              Enviamos a confirmação no seu WhatsApp. Até breve!
            </p>
          </Status>
        </Wrapper>
      );
    }
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

  // Resposta sem erro mas sem dados utilizáveis — evita tela em branco
  if (!info || (!info.kind && !info.slots && !info.used)) {
    return (
      <Wrapper>
        <Status icon={AlertCircle} title="Não foi possível abrir" tone="error">
          Tivemos um problema para carregar sua agenda. Atualize a página em alguns segundos ou peça um novo link à Sofia no WhatsApp.
        </Status>
      </Wrapper>
    );
  }

  if (confirmed) {
    const Icon = kindMeta[confirmed.kind].icon;
    return (
      <Wrapper>
        <Status icon={CheckCircle2} title="Tudo certo!" tone="success">
          Sua <strong className="text-white">{kindMeta[confirmed.kind].label.toLowerCase()}</strong> com o Hans está marcada para{" "}
          <strong className="text-white">{fmtDay(confirmed.datetime_iso)} às {fmtTime(confirmed.datetime_iso)}</strong>.
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 text-white px-4 py-1.5 text-sm">
            <Icon className="h-4 w-4" /> {kindMeta[confirmed.kind].label}
          </div>
          <p className="text-sm text-white/50 mt-5">
            Enviamos a confirmação no seu WhatsApp. Até breve!
          </p>
        </Status>
      </Wrapper>
    );
  }

  const kind = (selectedKind || info?.kind) as Kind | undefined;
  const Icon = kind ? kindMeta[kind].icon : Phone;
  const kindOptions: Kind[] = ["presencial", "videochamada", "ligacao"];

  return (
    <Wrapper>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 md:p-10 space-y-7 shadow-2xl">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Icon className="h-3.5 w-3.5" />
            {kind ? kindMeta[kind].label : "Agendamento"}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {info?.nome ? `Olá, ${info.nome.split(" ")[0]}!` : "Agende com o Hans"}
          </h1>
          <p className="text-white/50 text-sm md:text-base max-w-md">
            Escolha o tipo de contato, depois o dia e horário que ficam melhor para você.
          </p>
        </header>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-white/40">Como prefere falar?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {kindOptions.map((k) => {
              const Ico = kindMeta[k].icon;
              const active = (selectedKind || info?.kind) === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelectedKind(k)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm transition flex items-center gap-2.5 justify-center",
                    active
                      ? "bg-white text-black border-white"
                      : "bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  <Ico className="h-4 w-4" />
                  {kindMeta[k].label}
                  <span className={cn("text-[11px]", active ? "text-black/60" : "text-white/40")}>
                    · {k === "ligacao" ? "30min" : "60min"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {availableDays.length === 0 ? (
          <p className="text-sm text-white/50 py-10 text-center">
            Sem horários disponíveis nos próximos dias. Fale com a Sofia no WhatsApp para alternativas.
          </p>
        ) : (
          <div className="grid md:grid-cols-[auto_1fr] gap-6">
            <div className="rounded-xl border border-white/10 bg-black/40 p-2">
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={(d) => { setSelectedDay(d); setSelectedSlot(null); }}
                disabled={(date) => {
                  const k = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                  return !slotsByDay.has(k);
                }}
                className={cn("p-3 pointer-events-auto [&_button]:text-white/80 [&_button:hover]:bg-white/10 [&_[aria-selected=true]]:bg-white [&_[aria-selected=true]]:text-black [&_.rdp-day_disabled]:text-white/20 [&_.rdp-head_cell]:text-white/40 [&_.rdp-caption_label]:text-white [&_.rdp-nav_button]:text-white/70 [&_.rdp-nav_button:hover]:bg-white/10")}
              />
            </div>

            <div className="space-y-3 min-w-0">
              <p className="text-sm font-medium text-white/80 capitalize">
                {selectedDay
                  ? selectedDay.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
                  : "Selecione um dia"}
              </p>
              {slotsForDay.length === 0 ? (
                <p className="text-xs text-white/40">Sem horários neste dia.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slotsForDay.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSlot(s)}
                      className={cn(
                        "rounded-lg border px-2 py-2.5 text-sm transition",
                        selectedSlot === s
                          ? "bg-white text-black border-white"
                          : "bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20"
                      )}
                    >
                      {fmtTime(s)}
                    </button>
                  ))}
                </div>
              )}

              <button
                className={cn(
                  "w-full mt-5 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all",
                  !selectedSlot || confirming
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-white text-black hover:bg-white/90"
                )}
                disabled={!selectedSlot || confirming}
                onClick={confirmar}
              >
                {confirming ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Confirmando…</>
                ) : selectedSlot ? (
                  <>Confirmar {fmtDay(selectedSlot)} às {fmtTime(selectedSlot)}</>
                ) : (
                  "Selecione um horário"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-center">
          <img src={hrLogo} alt="HR Imóveis" className="h-12 w-auto object-contain" />
        </div>
      </header>

      <div className="px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto">{children}</div>
      </div>

      <footer className="border-t border-white/5 mt-10">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center text-[11px] text-white/30">
          HR Imóveis · Hans Rodovalho · Sinop-MT
        </div>
      </footer>
    </main>
  );
}

function Status({
  icon: Icon, title, children, tone,
}: {
  icon: typeof CheckCircle2; title: string; children: React.ReactNode; tone: "success" | "error";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-10 md:p-14 text-center space-y-5 shadow-2xl">
      <div className={cn(
        "inline-flex h-16 w-16 items-center justify-center rounded-full mx-auto",
        tone === "success" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
      )}>
        <Icon className="h-8 w-8" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
      <div className="text-white/60 text-sm md:text-base max-w-md mx-auto">{children}</div>
    </div>
  );
}
