// Meta — list Pages administered by the user behind META_PAGE_ACCESS_TOKEN
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN") || "";
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

  if (!TOKEN) {
    return new Response(
      JSON.stringify({ ok: false, error: "META_PAGE_ACCESS_TOKEN não configurado" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const url = `${GRAPH}/me/accounts?fields=id,name,access_token,tasks&limit=100&access_token=${encodeURIComponent(TOKEN)}`;
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: body?.error?.message || "Erro Graph API", details: body }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pages = (body?.data ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      id_ends_with_99: typeof p.id === "string" && p.id.endsWith("99"),
      tasks: p.tasks ?? [],
      page_access_token: p.access_token,
    }));

    const hr = pages.find((p: any) => p.id_ends_with_99) ||
               pages.find((p: any) => /hr\s*im[óo]veis/i.test(p.name));

    return new Response(
      JSON.stringify({
        ok: true,
        total: pages.length,
        hr_imoveis_found: !!hr,
        hr_imoveis: hr ?? null,
        all_pages: pages,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
