import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { userClient, adminClient } from "../_shared/google-calendar.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Não autenticado");
    const supa = userClient(auth);
    const { data: u } = await supa.auth.getUser();
    if (!u.user) throw new Error("Sessão inválida");

    const admin = adminClient();
    const { data: row } = await admin.from("user_google_calendar")
      .select("refresh_token").eq("user_id", u.user.id).maybeSingle();

    if (row?.refresh_token) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${row.refresh_token}`, { method: "POST" })
        .catch(() => {});
    }

    await admin.from("google_calendar_sync").delete().eq("user_id", u.user.id);
    await admin.from("user_google_calendar").delete().eq("user_id", u.user.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
