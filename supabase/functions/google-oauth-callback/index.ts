import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { adminClient, redirectUri } from "../_shared/google-calendar.ts";

const APP_ORIGIN = "https://id-preview--9ba329fa-bc86-4fa7-8521-f11e9da54abe.lovable.app";

function htmlResponse(ok: boolean, message: string) {
  const html = `<!doctype html><html><body style="font-family:system-ui;padding:32px;text-align:center;background:#0a0a0a;color:#fff">
<h2>${ok ? "✅ Google Calendar conectado!" : "❌ Falha ao conectar"}</h2>
<p>${message}</p>
<p>Você pode fechar esta janela.</p>
<script>
  try { window.opener && window.opener.postMessage({ source: 'google-oauth', ok: ${ok}, message: ${JSON.stringify(message)} }, '*'); } catch(e){}
  setTimeout(() => window.close(), 1500);
</script>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const err = url.searchParams.get("error");
    if (err) return htmlResponse(false, err);
    if (!code || !state) return htmlResponse(false, "Parâmetros faltando");

    let parsed: { user_id: string; ts: number };
    try { parsed = JSON.parse(atob(state)); } catch { return htmlResponse(false, "State inválido"); }

    const client_id = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
    const client_secret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri: redirectUri(req),
        grant_type: "authorization_code",
      }),
    });
    const tk = await tokenRes.json();
    if (!tokenRes.ok) return htmlResponse(false, tk.error_description || tk.error || "token error");

    // descobre o e-mail Google
    const ui = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tk.access_token}` },
    }).then(r => r.json());

    const supa = adminClient();
    const expires_at = new Date(Date.now() + (tk.expires_in ?? 3600) * 1000).toISOString();

    const { error: upErr } = await supa.from("user_google_calendar").upsert({
      user_id: parsed.user_id,
      google_email: ui.email,
      access_token: tk.access_token,
      refresh_token: tk.refresh_token,
      token_expires_at: expires_at,
      scope: tk.scope,
      calendar_id: "primary",
      connected_at: new Date().toISOString(),
      sync_token: null,
    }, { onConflict: "user_id" });
    if (upErr) return htmlResponse(false, upErr.message);

    return htmlResponse(true, `Conta ${ui.email} conectada com sucesso.`);
  } catch (e) {
    return htmlResponse(false, (e as Error).message);
  }
});
