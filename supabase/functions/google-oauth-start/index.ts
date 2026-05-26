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
    console.log("google-oauth-start config", {
      hasClientIdSecret: Boolean(Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")),
      hasClientSecretSecret: Boolean(Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")),
      parsedClientIdLooksValid: /^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(client_id),
      parsedClientIdLength: client_id.length,
      clientIdSecretContainsGoogleClientId: /[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com/.test(Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") ?? ""),
      clientSecretContainsGoogleClientId: /[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com/.test(Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") ?? ""),
    });
    if (!client_id) throw new Error("GOOGLE_OAUTH_CLIENT_ID não configurado");
    if (!/^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(client_id)) {
      throw new Error("O Client ID do Google Calendar está inválido. Cole o OAuth Client ID do tipo Web application, ou o JSON baixado do Google Cloud, em GOOGLE_OAUTH_CLIENT_ID.");
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
