// Gerencia a agenda Google compartilhada da equipe.
// Ações: create | get | list_members | add_members | remove_member | update_push_flag
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  adminClient,
  formatGoogleCalendarApiError,
  getValidAccessToken,
  gcalFetch,
  TIMEZONE,
} from "../_shared/google-calendar.ts";

type Role = "reader" | "writer" | "owner";
type Action =
  | "create"
  | "get"
  | "list_members"
  | "add_members"
  | "remove_member"
  | "update_push_flag";

const SETTINGS_KEY = "shared_calendar";
const CALENDAR_SUMMARY = "Agenda HR Imóveis";

function userClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

async function loadSettings(supa: ReturnType<typeof adminClient>) {
  const { data } = await supa
    .from("site_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();
  const v = (data as any)?.value;
  if (!v || typeof v !== "object" || !v.google_calendar_id) return null;
  return {
    google_calendar_id: v.google_calendar_id as string,
    owner_user_id: v.owner_user_id as string,
    created_at: v.created_at as string,
    push_to_personal: v.push_to_personal !== false,
  };
}

async function saveSettings(supa: ReturnType<typeof adminClient>, value: any) {
  const { error } = await supa
    .from("site_settings")
    .upsert({ key: SETTINGS_KEY, value }, { onConflict: "key" });
  if (error) throw error;
}

async function assertAdmin(supa: ReturnType<typeof adminClient>, user_id: string) {
  const { data } = await supa
    .from("user_roles")
    .select("role")
    .eq("user_id", user_id)
    .in("role", ["admin", "gestor"]);
  if (!data || data.length === 0) throw new Error("Apenas admin/gestor pode gerenciar a agenda compartilhada");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Não autenticado");
    const usupa = userClient(auth);
    const { data: u } = await usupa.auth.getUser();
    if (!u.user) throw new Error("Sessão inválida");

    const supa = adminClient();
    await assertAdmin(supa, u.user.id);

    const body = await req.json().catch(() => ({}));
    const action: Action = body.action;
    if (!action) throw new Error("action obrigatório");

    // ---- create ----
    if (action === "create") {
      const existing = await loadSettings(supa);
      if (existing) {
        return new Response(JSON.stringify({ ok: true, settings: existing, alreadyExists: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const conn = await getValidAccessToken(supa, u.user.id);
      if (!conn) throw new Error("Conecte sua conta Google primeiro");

      const r = await gcalFetch(conn.access_token, `/calendars`, {
        method: "POST",
        body: JSON.stringify({
          summary: CALENDAR_SUMMARY,
          description: "Agenda compartilhada da equipe HR Imóveis — sincronizada com o CRM.",
          timeZone: TIMEZONE,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(formatGoogleCalendarApiError(r.status, j));

      const settings = {
        google_calendar_id: j.id,
        owner_user_id: u.user.id,
        created_at: new Date().toISOString(),
        push_to_personal: true,
      };
      await saveSettings(supa, settings);
      return new Response(JSON.stringify({ ok: true, settings }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- get ----
    if (action === "get") {
      const settings = await loadSettings(supa);
      return new Response(JSON.stringify({ ok: true, settings }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // todas as ações abaixo precisam de settings + token do dono
    const settings = await loadSettings(supa);
    if (!settings) throw new Error("Agenda compartilhada ainda não criada");

    const ownerConn = await getValidAccessToken(supa, settings.owner_user_id);
    if (!ownerConn) throw new Error("Dono da agenda compartilhada precisa reconectar a conta Google");

    // ---- list_members ----
    if (action === "list_members") {
      const r = await gcalFetch(
        ownerConn.access_token,
        `/calendars/${encodeURIComponent(settings.google_calendar_id)}/acl`,
      );
      const j = await r.json();
      if (!r.ok) throw new Error(formatGoogleCalendarApiError(r.status, j));
      const items = (j.items ?? [])
        .filter((it: any) => it.scope?.type === "user")
        .map((it: any) => ({ id: it.id as string, email: it.scope.value as string, role: it.role as Role }));
      return new Response(JSON.stringify({ ok: true, members: items }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- add_members ----
    if (action === "add_members") {
      const members: { email: string; role: Role }[] = body.members ?? [];
      if (!Array.isArray(members) || members.length === 0) throw new Error("members vazio");
      const results: any[] = [];
      for (const m of members) {
        const role: Role = m.role === "writer" || m.role === "owner" ? m.role : "reader";
        const r = await gcalFetch(
          ownerConn.access_token,
          `/calendars/${encodeURIComponent(settings.google_calendar_id)}/acl?sendNotifications=true`,
          {
            method: "POST",
            body: JSON.stringify({ role, scope: { type: "user", value: m.email } }),
          },
        );
        const j = await r.json();
        if (!r.ok) {
          results.push({ email: m.email, ok: false, error: formatGoogleCalendarApiError(r.status, j) });
        } else {
          results.push({ email: m.email, ok: true, id: j.id, role: j.role });
        }
      }
      return new Response(JSON.stringify({ ok: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- remove_member ----
    if (action === "remove_member") {
      const ruleId = body.ruleId as string;
      if (!ruleId) throw new Error("ruleId obrigatório");
      const r = await gcalFetch(
        ownerConn.access_token,
        `/calendars/${encodeURIComponent(settings.google_calendar_id)}/acl/${encodeURIComponent(ruleId)}`,
        { method: "DELETE" },
      );
      if (!r.ok && r.status !== 404) {
        const txt = await r.text();
        throw new Error(formatGoogleCalendarApiError(r.status, txt));
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- update_push_flag ----
    if (action === "update_push_flag") {
      const push_to_personal = body.push_to_personal !== false;
      await saveSettings(supa, { ...settings, push_to_personal });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Ação desconhecida: ${action}`);
  } catch (e) {
    console.error("gcal-shared-calendar error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
