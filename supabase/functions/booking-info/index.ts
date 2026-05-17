// Booking info — endpoint público chamado pela página /agendar/:token
// Devolve dados do agendamento + slots disponíveis nos próximos 14 dias úteis.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TZ_OFFSET_MIN = -180; // America/Sao_Paulo (UTC-3, sem horário de verão)

function durationMin(kind: string): number {
  return kind === "ligacao" ? 30 : 60;
}

// Constrói lista de slots dos próximos 14 dias úteis, 9h-18h em São Paulo.
// Retorna timestamps ISO em UTC, descartando slots no passado e os que conflitem.
function buildSlots(durationMinutes: number, busyRanges: Array<{ start: number; end: number }>) {
  const slots: string[] = [];
  const now = Date.now();
  const stepMs = durationMinutes * 60 * 1000;

  // Hoje em São Paulo (compensando offset)
  const nowSp = new Date(now - TZ_OFFSET_MIN * 60 * 1000);
  const startDay = new Date(Date.UTC(nowSp.getUTCFullYear(), nowSp.getUTCMonth(), nowSp.getUTCDate()));

  let added = 0;
  for (let d = 0; d < 21 && added < 200; d++) {
    const day = new Date(startDay.getTime() + d * 24 * 60 * 60 * 1000);
    const dow = day.getUTCDay(); // 0=dom 6=sab no fuso SP (já alinhado)
    if (dow === 0 || dow === 6) continue;

    // 9:00 SP → UTC = 12:00; 18:00 SP → 21:00. Construímos via offset em ms.
    for (let hour = 9; hour < 18; hour++) {
      for (let m = 0; m < 60; m += durationMinutes === 30 ? 30 : 60) {
        // Hora local SP em ms desde epoch UTC: dia(00:00 UTC representando 00:00 SP) + (hour*60+m + 180min)
        const slotMs = day.getTime() + (hour * 60 + m - TZ_OFFSET_MIN) * 60 * 1000;
        if (slotMs < now + 60 * 60 * 1000) continue; // mínimo 1h de antecedência
        const endMs = slotMs + stepMs;
        const conflict = busyRanges.some(b => slotMs < b.end && endMs > b.start);
        if (conflict) continue;
        slots.push(new Date(slotMs).toISOString());
        added++;
      }
    }
  }
  return slots;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    const kindOverride = url.searchParams.get("kind") || "";
    if (!/^[a-zA-Z0-9_-]{16,64}$/.test(token)) {
      return new Response(JSON.stringify({ error: "token inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: link } = await supabase
      .from("booking_links")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (!link) {
      return new Response(JSON.stringify({ error: "link não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (link.used_at) {
      let datetime_iso: string | null = null;
      if (link.reuniao_id) {
        if (link.kind === "ligacao") {
          const { data } = await supabase.from("ligacoes")
            .select("data").eq("id", link.reuniao_id).maybeSingle();
          datetime_iso = (data?.data as string) ?? null;
        } else {
          const { data } = await supabase.from("reunioes")
            .select("agendada_para").eq("id", link.reuniao_id).maybeSingle();
          datetime_iso = (data?.agendada_para as string) ?? null;
        }
      }
      return new Response(JSON.stringify({
        used: true,
        nome: link.nome,
        kind: link.kind,
        reuniao_id: link.reuniao_id,
        datetime_iso,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (new Date(link.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "link expirado", expired: true }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedKinds = ["videochamada", "presencial", "ligacao", "whatsapp"];
    const effectiveKind = allowedKinds.includes(kindOverride) ? kindOverride : link.kind;
    const dur = durationMin(effectiveKind);

    // Janela: agora -> +21 dias
    const fromIso = new Date().toISOString();
    const toIso = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: reunioes }, { data: bloqueios }] = await Promise.all([
      supabase.from("reunioes")
        .select("agendada_para, duracao_min, status")
        .gte("agendada_para", fromIso)
        .lte("agendada_para", toIso)
        .neq("status", "cancelada"),
      supabase.from("agenda_bloqueios")
        .select("inicio, fim")
        .gte("fim", fromIso)
        .lte("inicio", toIso),
    ]);

    const busy: Array<{ start: number; end: number }> = [];
    for (const r of reunioes ?? []) {
      const s = new Date(r.agendada_para as string).getTime();
      busy.push({ start: s, end: s + ((r.duracao_min as number) || 60) * 60 * 1000 });
    }
    for (const b of bloqueios ?? []) {
      busy.push({
        start: new Date(b.inicio as string).getTime(),
        end: new Date(b.fim as string).getTime(),
      });
    }

    const slots = buildSlots(dur, busy);

    return new Response(JSON.stringify({
      nome: link.nome,
      kind: effectiveKind,
      original_kind: link.kind,
      duracao_min: dur,
      slots,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("booking-info error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
