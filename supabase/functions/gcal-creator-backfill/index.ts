// Reprocessa eventos já importados do Google Calendar para corrigir o `created_by`
// das reuniões na tabela public.reunioes. Para cada mapping em google_calendar_sync
// (entity_type = 'reuniao'), busca o evento no Google, lê creator/organizer email e
// cruza com profiles.email para resolver o criador real.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { adminClient, formatGoogleCalendarApiError, getValidAccessToken, gcalFetch } from "../_shared/google-calendar.ts";

type Stats = {
  user_id: string;
  total: number;
  updated: number;
  unchanged: number;
  no_email: number;
  no_match: number;
  errors: number;
};

async function backfillForUser(supa: ReturnType<typeof adminClient>, user_id: string): Promise<Stats> {
  const stats: Stats = { user_id, total: 0, updated: 0, unchanged: 0, no_email: 0, no_match: 0, errors: 0 };
  const conn = await getValidAccessToken(supa, user_id);
  if (!conn) return stats;

  // Cache local de email -> user_id pra evitar N queries no profiles
  const profileCache = new Map<string, string | null>();
  async function resolveCreator(email: string): Promise<string | null> {
    const key = email.toLowerCase().trim();
    if (!key) return null;
    if (profileCache.has(key)) return profileCache.get(key)!;
    const { data: prof } = await supa
      .from("profiles")
      .select("user_id")
      .ilike("email", key)
      .maybeSingle();
    const val = prof?.user_id ?? null;
    profileCache.set(key, val);
    return val;
  }

  const { data: maps } = await supa
    .from("google_calendar_sync")
    .select("entity_id, google_event_id, calendar_id")
    .eq("user_id", user_id)
    .eq("entity_type", "reuniao");

  for (const m of maps ?? []) {
    stats.total++;
    try {
      const r = await gcalFetch(
        conn.access_token,
        `/calendars/${encodeURIComponent(m.calendar_id)}/events/${encodeURIComponent(m.google_event_id)}`,
      );
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        // 404: evento sumiu do Google. Não conta como erro fatal.
        if (r.status === 404 || r.status === 410) { stats.errors++; continue; }
        console.error(`[backfill] evento ${m.google_event_id}: ${formatGoogleCalendarApiError(r.status, j)}`);
        stats.errors++;
        continue;
      }
      const ev = await r.json();
      const email = (ev.creator?.email || ev.organizer?.email || "").toLowerCase().trim();
      if (!email) { stats.no_email++; continue; }

      const realCreator = await resolveCreator(email);
      if (!realCreator) {
        console.log(`[backfill] sem profile para ${email} (event ${m.google_event_id})`);
        stats.no_match++;
        continue;
      }

      // Lê o created_by atual e atualiza se for diferente.
      const { data: reu } = await supa
        .from("reunioes")
        .select("created_by")
        .eq("id", m.entity_id)
        .maybeSingle();
      if (!reu) { stats.errors++; continue; }
      if (reu.created_by === realCreator) { stats.unchanged++; continue; }

      const { error: updErr } = await supa
        .from("reunioes")
        .update({ created_by: realCreator })
        .eq("id", m.entity_id);
      if (updErr) {
        console.error(`[backfill] falha update ${m.entity_id}:`, updErr.message);
        stats.errors++;
      } else {
        stats.updated++;
      }
    } catch (e) {
      console.error(`[backfill] erro inesperado em ${m.google_event_id}:`, (e as Error).message);
      stats.errors++;
    }
  }

  return stats;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supa = adminClient();
    const url = new URL(req.url);
    let bodyUserId: string | null = null;
    if (req.method !== "GET") {
      try {
        const body = await req.json();
        bodyUserId = typeof body?.user_id === "string" ? body.user_id : null;
      } catch { /* ignore */ }
    }
    const single = url.searchParams.get("user_id") ?? bodyUserId;

    let users: { user_id: string }[];
    if (single) users = [{ user_id: single }];
    else {
      const { data } = await supa.from("user_google_calendar").select("user_id");
      users = data ?? [];
    }

    const results: Stats[] = [];
    for (const u of users) {
      try { results.push(await backfillForUser(supa, u.user_id)); }
      catch (e) {
        console.error(`[backfill] usuário ${u.user_id} falhou:`, (e as Error).message);
        results.push({ user_id: u.user_id, total: 0, updated: 0, unchanged: 0, no_email: 0, no_match: 0, errors: 1 });
      }
    }

    const totals = results.reduce((acc, r) => ({
      total: acc.total + r.total,
      updated: acc.updated + r.updated,
      unchanged: acc.unchanged + r.unchanged,
      no_email: acc.no_email + r.no_email,
      no_match: acc.no_match + r.no_match,
      errors: acc.errors + r.errors,
    }), { total: 0, updated: 0, unchanged: 0, no_email: 0, no_match: 0, errors: 0 });

    return new Response(JSON.stringify({ ok: true, totals, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
