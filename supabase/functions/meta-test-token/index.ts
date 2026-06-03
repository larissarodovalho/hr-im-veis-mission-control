// Meta — test Page Access Token by calling Graph API /me and debug_token
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PAGE_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN") || "";
const APP_SECRET = Deno.env.get("META_APP_SECRET") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: claims, error: cErr } = await supabase.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (cErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!PAGE_TOKEN) {
    return new Response(
      JSON.stringify({ ok: false, error: "META_PAGE_ACCESS_TOKEN não configurado" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(PAGE_TOKEN)}`,
    );
    const me = await meRes.json();
    if (!meRes.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: me?.error?.message || "Erro Graph API", details: me }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // debug_token requires app access token (app_id|app_secret). We only have app secret here,
    // so we use the page token itself as the "access_token" param — Meta accepts this when
    // inspecting a token issued for the same app.
    let expires_at: number | null = null;
    let data_access_expires_at: number | null = null;
    let token_type: string | null = null;
    let is_valid: boolean | null = null;
    let scopes: string[] = [];
    try {
      const dbgRes = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(PAGE_TOKEN)}&access_token=${encodeURIComponent(PAGE_TOKEN)}`,
      );
      const dbg = await dbgRes.json();
      const d = dbg?.data;
      if (d) {
        expires_at = d.expires_at ?? 0;
        data_access_expires_at = d.data_access_expires_at ?? null;
        token_type = d.type ?? null;
        is_valid = d.is_valid ?? null;
        scopes = d.scopes ?? [];
      }
    } catch { /* debug_token is best-effort */ }

    return new Response(
      JSON.stringify({
        ok: true,
        page_id: me.id,
        page_name: me.name,
        token: {
          type: token_type,
          is_valid,
          expires_at, // 0 = never expires
          expires_at_iso: expires_at && expires_at > 0 ? new Date(expires_at * 1000).toISOString() : null,
          never_expires: expires_at === 0,
          data_access_expires_at_iso: data_access_expires_at
            ? new Date(data_access_expires_at * 1000).toISOString()
            : null,
          scopes,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
