import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { userClient, GOOGLE_OAUTH_SCOPES, redirectUri } from "../_shared/google-calendar.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Não autenticado");
    const supa = userClient(auth);
    const { data: u, error: ue } = await supa.auth.getUser();
    if (ue || !u.user) throw new Error("Sessão inválida");

    const client_id = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    if (!client_id) throw new Error("GOOGLE_OAUTH_CLIENT_ID não configurado");

    const state = btoa(JSON.stringify({ user_id: u.user.id, ts: Date.now() }));
    const params = new URLSearchParams({
      client_id,
      redirect_uri: redirectUri(req),
      response_type: "code",
      access_type: "offline",
      include_granted_scopes: "true",
      prompt: "consent",
      scope: GOOGLE_OAUTH_SCOPES,
      state,
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
