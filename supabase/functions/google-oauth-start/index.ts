import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { userClient, GOOGLE_OAUTH_SCOPES, redirectUri, googleOAuthClientId } from "../_shared/google-calendar.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Não autenticado");
    const supa = userClient(auth);
    const { data: u, error: ue } = await supa.auth.getUser();
    if (ue || !u.user) throw new Error("Sessão inválida");

    const client_id = googleOAuthClientId();
    if (!client_id) throw new Error("GOOGLE_OAUTH_CLIENT_ID não configurado");
    if (!/^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(client_id)) {
      const idHasClientId = /[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com/.test(Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") ?? "");
      const secretHasClientId = /[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com/.test(Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") ?? "");
      return new Response(JSON.stringify({
        ok: false,
        setupRequired: true,
        error: `O Client ID do Google Calendar está inválido. O segredo GOOGLE_OAUTH_CLIENT_ID ${idHasClientId ? "contém" : "não contém"} um OAuth Client ID válido e GOOGLE_OAUTH_CLIENT_SECRET ${secretHasClientId ? "contém" : "não contém"} um OAuth Client ID válido. Use o Client ID do tipo Web application que termina com .apps.googleusercontent.com.`,
        redirectUri: redirectUri(req),
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
