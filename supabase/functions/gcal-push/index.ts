// Publica/atualiza/remove um evento do CRM na agenda Google do responsável.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { adminClient, formatGoogleCalendarApiError, getValidAccessToken, gcalFetch, TIMEZONE } from "../_shared/google-calendar.ts";

type EntityType = "reuniao" | "ligacao" | "visita" | "captacao";
type Action = "create" | "update" | "delete";

// Cor determinística por usuário criador, alinhada com a paleta da agenda interna.
// Google Calendar aceita colorId de "1" a "11" em eventos.
function colorIdForUser(userId?: string | null): string | undefined {
  if (!userId) return undefined;
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  return String((h % 11) + 1);
}


async function buildEventPayload(supa: ReturnType<typeof adminClient>, entity_type: EntityType, entity_id: string) {
  if (entity_type === "reuniao") {
    const { data: r } = await supa.from("reunioes").select("*").eq("id", entity_id).maybeSingle();
    if (!r) return null;
    const start = new Date(r.agendada_para);
    const end = new Date(start.getTime() + (r.duracao_min ?? 60) * 60000);
    const summary = r.titulo || "Reunião — HR Imóveis";
    return {
      ownerUserId: r.corretor_id ?? r.created_by,
      contaId: r.conta_id,
      payload: {
        summary,
        description: [r.notas, r.link ? `Link: ${r.link}` : null].filter(Boolean).join("\n\n"),
        location: r.local || undefined,
        start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
        colorId: colorIdForUser(r.created_by),
      },
    };
  }
  if (entity_type === "ligacao") {
    const { data: r } = await supa.from("ligacoes").select("*").eq("id", entity_id).maybeSingle();
    if (!r) return null;
    const start = new Date(r.data);
    const end = new Date(start.getTime() + Math.max(15, Math.round((r.duracao_seg ?? 1800) / 60)) * 60000);
    return {
      ownerUserId: r.corretor_id ?? r.created_by,
      contaId: r.conta_id,
      payload: {
        summary: "Ligação — HR Imóveis",
        description: r.notas || "",
        start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
        colorId: colorIdForUser(r.created_by),
      },
    };
  }
  if (entity_type === "visita") {
    const { data: r } = await supa.from("visitas").select("*, imoveis(titulo, endereco, cidade)").eq("id", entity_id).maybeSingle();
    if (!r) return null;
    const start = new Date(r.data_visita);
    const end = new Date(start.getTime() + 60 * 60000);
    const im: any = (r as any).imoveis;
    return {
      ownerUserId: r.corretor_id ?? r.created_by,
      contaId: r.conta_id,
      payload: {
        summary: `Visita — ${im?.titulo ?? "Imóvel"}`,
        description: r.observacoes || "",
        location: im ? [im.endereco, im.cidade].filter(Boolean).join(", ") : undefined,
        start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
        colorId: colorIdForUser(r.created_by),
      },
    };
  }
  if (entity_type === "captacao") {
    const { data: r } = await supa.from("captacoes_imovel").select("*").eq("id", entity_id).maybeSingle();
    if (!r) return null;
    if (!r.data_agendada) return null;
    const start = new Date(r.data_agendada);
    const end = new Date(start.getTime() + 60 * 60000);
    const { data: im } = r.imovel_id
      ? await supa.from("imoveis").select("titulo, endereco, cidade").eq("id", r.imovel_id).maybeSingle()
      : { data: null };
    return {
      ownerUserId: r.responsavel_id ?? r.created_by,
      contaId: r.conta_id,
      payload: {
        summary: `Captação — ${im?.titulo ?? "Imóvel"}`,
        description: r.observacoes || "",
        location: im ? [im.endereco, im.cidade].filter(Boolean).join(", ") : undefined,
        start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
      },
    };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { entity_type, entity_id, action } = body as { entity_type: EntityType; entity_id: string; action: Action };
    if (!entity_type || !entity_id || !action) throw new Error("payload inválido");

    const supa = adminClient();

    if (action === "delete") {
      const { data: maps } = await supa.from("google_calendar_sync")
        .select("*").eq("entity_type", entity_type).eq("entity_id", entity_id);
      for (const m of maps ?? []) {
        const conn = await getValidAccessToken(supa, m.user_id);
        if (!conn) continue;
        const calId = (m as any).calendar_id || conn.calendar_id;
        await gcalFetch(conn.access_token, `/calendars/${encodeURIComponent(calId)}/events/${m.google_event_id}`, { method: "DELETE" });
      }
      await supa.from("google_calendar_sync").delete().eq("entity_type", entity_type).eq("entity_id", entity_id);
      return new Response(JSON.stringify({ ok: true, deleted: maps?.length ?? 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const built = await buildEventPayload(supa, entity_type, entity_id);
    if (!built) {
      return new Response(JSON.stringify({ ok: true, skipped: "evento não encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // atendentes: e-mail do contato da conta (se houver)
    let attendees: { email: string }[] = [];
    if (built.contaId) {
      const { data: conta } = await supa.from("contas").select("email").eq("id", built.contaId).maybeSingle();
      if (conta?.email) attendees.push({ email: conta.email });
    }
    const fullPayload = attendees.length ? { ...built.payload, attendees } : built.payload;

    // Carrega configuração da agenda compartilhada (se existir)
    const { data: sharedRow } = await supa.from("site_settings")
      .select("value").eq("key", "shared_calendar").maybeSingle();
    const shared = (sharedRow as any)?.value && (sharedRow as any).value.google_calendar_id
      ? {
          google_calendar_id: (sharedRow as any).value.google_calendar_id as string,
          owner_user_id: (sharedRow as any).value.owner_user_id as string,
          push_to_personal: (sharedRow as any).value.push_to_personal !== false,
        }
      : null;

    // Faz push para um destino (calendário pessoal ou compartilhado).
    // Cada destino tem seu próprio registro em google_calendar_sync (chave: user_id, entity_type, entity_id).
    async function pushTo(target_user_id: string, calendar_id: string, access_token: string) {
      const { data: existing } = await supa.from("google_calendar_sync")
        .select("*").eq("user_id", target_user_id)
        .eq("calendar_id", calendar_id)
        .eq("entity_type", entity_type).eq("entity_id", entity_id).maybeSingle();

      let r: Response;
      if (existing) {
        r = await gcalFetch(access_token, `/calendars/${encodeURIComponent(calendar_id)}/events/${existing.google_event_id}`, {
          method: "PATCH", body: JSON.stringify(fullPayload),
        });
      } else {
        r = await gcalFetch(access_token, `/calendars/${encodeURIComponent(calendar_id)}/events?sendUpdates=all`, {
          method: "POST", body: JSON.stringify(fullPayload),
        });
      }
      const ev = await r.json();
      if (!r.ok) throw new Error(formatGoogleCalendarApiError(r.status, ev));

      await supa.from("google_calendar_sync").upsert({
        user_id: target_user_id,
        calendar_id,
        entity_type, entity_id,
        google_event_id: ev.id,
        etag: ev.etag,
        html_link: ev.htmlLink,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: "user_id,calendar_id,entity_type,entity_id" });
      return { eventId: ev.id, htmlLink: ev.htmlLink };
    }

    const results: any = {};

    // 1) push para o responsável (se houver e se push_to_personal não estiver desligado)
    const personalAllowed = !shared || shared.push_to_personal;
    if (personalAllowed && built.ownerUserId) {
      const conn = await getValidAccessToken(supa, built.ownerUserId);
      if (conn) {
        try { results.personal = await pushTo(built.ownerUserId, conn.calendar_id, conn.access_token); }
        catch (e) { results.personal = { error: (e as Error).message }; }
      } else {
        results.personal = { skipped: "responsável sem Google conectado" };
      }
    }

    // 2) push para a agenda compartilhada da equipe (se configurada)
    if (shared) {
      const ownerConn = await getValidAccessToken(supa, shared.owner_user_id);
      if (ownerConn) {
        try { results.shared = await pushTo(shared.owner_user_id, shared.google_calendar_id, ownerConn.access_token); }
        catch (e) { results.shared = { error: (e as Error).message }; }
      } else {
        results.shared = { skipped: "dono da agenda compartilhada precisa reconectar Google" };
      }
    }

    if (!results.personal && !results.shared) {
      return new Response(JSON.stringify({ ok: true, skipped: "nenhum destino disponível" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gcal-push error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
