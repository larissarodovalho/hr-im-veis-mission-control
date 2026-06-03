// Meta — test Page Access Token by calling Graph API /me and debug_token
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PAGE_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN") || "";
const GRAPH = "https://graph.facebook.com/v21.0";

async function resolveHRPageToken(token: string) {
  const meRes = await fetch(`${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
  const me = await meRes.json();
  if (!meRes.ok) return { error: me?.error?.message || "Token inválido", details: me };
  if (me.id?.endsWith("99")) {
    return { pageId: me.id, pageName: me.name, token };
  }
  const accRes = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token&limit=100&access_token=${encodeURIComponent(token)}`);
  const acc = await accRes.json();
  const pages = (acc?.data ?? []) as any[];
  const hr = pages.find((p) => p.id?.endsWith("99")) ?? pages.find((p) => /hr\s*im[oó]veis/i.test(p.name ?? ""));
  if (!hr) return { error: "Página HR Imóveis não encontrada", details: acc };
  return { pageId: hr.id, pageName: hr.name, token: hr.access_token };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: claims, error: cErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (cErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!PAGE_TOKEN) {
    return new Response(JSON.stringify({ ok: false, error: "META_PAGE_ACCESS_TOKEN não configurado" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const resolved = await resolveHRPageToken(PAGE_TOKEN);
    if ("error" in resolved) {
      return new Response(JSON.stringify({ ok: false, error: resolved.error, details: resolved.details }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let expires_at: number | null = null;
    let data_access_expires_at: number | null = null;
    let token_type: string | null = null;
    let is_valid: boolean | null = null;
    let scopes: string[] = [];
    try {
      const dbgRes = await fetch(
        `${GRAPH}/debug_token?input_token=${encodeURIComponent(resolved.token)}&access_token=${encodeURIComponent(PAGE_TOKEN)}`,
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
    } catch { /* best-effort */ }

    return new Response(
      JSON.stringify({
        ok: true,
        page_id: resolved.pageId,
        page_name: resolved.pageName,
        token: {
          type: token_type,
          is_valid,
          expires_at,
          expires_at_iso: expires_at && expires_at > 0 ? new Date(expires_at * 1000).toISOString() : null,
          never_expires: expires_at === 0,
          data_access_expires_at_iso: data_access_expires_at
            ? new Date(data_access_expires_at * 1000).toISOString() : null,
          scopes,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
