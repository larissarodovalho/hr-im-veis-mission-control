// Importa eventos novos da agenda Google pessoal de cada usuário conectado.
// Pode ser chamada manualmente ou via cron.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { adminClient, formatGoogleCalendarApiError, getValidAccessToken, gcalFetch } from "../_shared/google-calendar.ts";

async function pullForUser(supa: ReturnType<typeof adminClient>, user_id: string) {
  const conn = await getValidAccessToken(supa, user_id);
  if (!conn) return { user_id, skipped: true };

  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;
  let imported = 0;
  let updated = 0;
  let deleted = 0;

  do {
    const params = new URLSearchParams({ singleEvents: "true", maxResults: "250" });
    if (conn.sync_token) params.set("syncToken", conn.sync_token);
    else {
      params.set("timeMin", new Date().toISOString());
      params.set("orderBy", "startTime");
    }
    if (pageToken) params.set("pageToken", pageToken);

    const r = await gcalFetch(conn.access_token, `/calendars/${encodeURIComponent(conn.calendar_id)}/events?${params.toString()}`);
    if (r.status === 410) {
      // sync token invalidado, faz full resync da próxima vez
      await supa.from("user_google_calendar").update({ sync_token: null }).eq("user_id", user_id);
      return { user_id, reset: true };
    }
    const j = await r.json();
    if (!r.ok) throw new Error(formatGoogleCalendarApiError(r.status, j));

    for (const ev of j.items ?? []) {
      // procura mapping existente
      const { data: map } = await supa.from("google_calendar_sync")
        .select("*").eq("user_id", user_id).eq("google_event_id", ev.id).maybeSingle();

      if (ev.status === "cancelled") {
        if (map) {
          await supa.from(map.entity_type === "reuniao" ? "reunioes" : "reunioes").delete().eq("id", map.entity_id);
          await supa.from("google_calendar_sync").delete().eq("id", map.id);
          deleted++;
        }
        continue;
      }

      const startISO = ev.start?.dateTime || (ev.start?.date ? `${ev.start.date}T09:00:00-03:00` : null);
      if (!startISO) continue;
      const endISO = ev.end?.dateTime || (ev.end?.date ? `${ev.end.date}T10:00:00-03:00` : null);
      const duracao_min = endISO ? Math.max(15, Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 60000)) : 60;

      if (map) {
        await supa.from("reunioes").update({
          titulo: ev.summary || "Evento Google",
          agendada_para: startISO,
          duracao_min,
          local: ev.location ?? null,
          notas: ev.description ?? null,
        }).eq("id", map.entity_id);
        await supa.from("google_calendar_sync").update({
          etag: ev.etag, html_link: ev.htmlLink, last_synced_at: new Date().toISOString(),
        }).eq("id", map.id);
        updated++;
      } else {
        // Não importa mais eventos do Google que não foram criados pelo CRM.
        // Apenas eventos com mapeamento existente (criados via gcal-push) são atualizados.
        continue;
      }

    }
    pageToken = j.nextPageToken;
    if (!pageToken && j.nextSyncToken) nextSyncToken = j.nextSyncToken;
  } while (pageToken);

  if (nextSyncToken) {
    await supa.from("user_google_calendar").update({
      sync_token: nextSyncToken, last_sync_at: new Date().toISOString(), last_sync_error: null,
    }).eq("user_id", user_id);
  } else {
    await supa.from("user_google_calendar").update({
      last_sync_at: new Date().toISOString(), last_sync_error: null,
    }).eq("user_id", user_id);
  }
  return { user_id, imported, updated, deleted };
}

async function runSync(supa: ReturnType<typeof adminClient>, users: { user_id: string }[]) {
  for (const u of users) {
    try { await pullForUser(supa, u.user_id); }
    catch (e) {
      await supa.from("user_google_calendar")
        .update({ last_sync_error: (e as Error).message })
        .eq("user_id", u.user_id);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supa = adminClient();
    const url = new URL(req.url);
    let bodyUserId: string | null = null;
    let waitFlag = false;
    if (req.method !== "GET") {
      try {
        const body = await req.json();
        bodyUserId = typeof body?.user_id === "string" ? body.user_id : null;
        waitFlag = body?.wait === true;
      } catch { /* ignore */ }
    }
    const single = url.searchParams.get("user_id") ?? bodyUserId;
    const wait = waitFlag || url.searchParams.get("wait") === "1";

    let users: { user_id: string }[];
    if (single) users = [{ user_id: single }];
    else {
      const { data } = await supa.from("user_google_calendar").select("user_id");
      users = data ?? [];
    }

    // Modo síncrono apenas se solicitado explicitamente (uso por cron com poucos users).
    if (wait) {
      const results = [];
      for (const u of users) {
        try { results.push(await pullForUser(supa, u.user_id)); }
        catch (e) {
          await supa.from("user_google_calendar").update({ last_sync_error: (e as Error).message }).eq("user_id", u.user_id);
          results.push({ user_id: u.user_id, error: (e as Error).message });
        }
      }
      return new Response(JSON.stringify({ ok: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Background: retorna 202 imediatamente para evitar IDLE_TIMEOUT (150s).
    // Cliente faz polling em user_google_calendar.last_sync_at / last_sync_error.
    // @ts-ignore EdgeRuntime global
    EdgeRuntime.waitUntil(runSync(supa, users));
    return new Response(JSON.stringify({ ok: true, queued: users.length }), {
      status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
