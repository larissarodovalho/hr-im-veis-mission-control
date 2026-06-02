// Force subscribe the Page to leadgen field using the META_PAGE_ACCESS_TOKEN's app
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PAGE_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN") || "";
const GRAPH = "https://graph.facebook.com/v21.0";

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
    // Identify page from token
    const meRes = await fetch(`${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(PAGE_TOKEN)}`);
    const me = await meRes.json();
    if (!meRes.ok) {
      return new Response(JSON.stringify({ ok: false, step: "me", error: me?.error?.message ?? "Token inválido", details: me }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const pageId = me.id as string;

    // Force subscribe to leadgen
    const subUrl = `${GRAPH}/${pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${encodeURIComponent(PAGE_TOKEN)}`;
    const subRes = await fetch(subUrl, { method: "POST" });
    const sub = await subRes.json();

    // Re-read subscribed apps to confirm
    const checkRes = await fetch(`${GRAPH}/${pageId}/subscribed_apps?access_token=${encodeURIComponent(PAGE_TOKEN)}`);
    const check = await checkRes.json();
    const apps = (check?.data ?? []) as any[];
    const leadgen_subscribed = apps.some((a) => (a.subscribed_fields ?? []).includes("leadgen"));

    return new Response(
      JSON.stringify({
        ok: subRes.ok && leadgen_subscribed,
        page_id: pageId,
        page_name: me.name,
        subscribe_response: sub,
        subscribed_apps: apps.map((a) => ({
          app_id: a.id,
          name: a.name,
          subscribed_fields: a.subscribed_fields ?? [],
        })),
        leadgen_subscribed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
