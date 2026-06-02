// Meta — diagnostic: checks Page Access Token, subscribed_apps and leadgen_forms
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PAGE_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN") || "";
const GRAPH = "https://graph.facebook.com/v21.0";

async function gget(path: string) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${GRAPH}${path}${sep}access_token=${encodeURIComponent(PAGE_TOKEN)}`);
  const body = await res.json();
  return { ok: res.ok, status: res.status, body };
}

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

  const diagnostico: string[] = [];
  const result: any = {
    token_ok: false,
    page_id_token: null,
    page_name: null,
    subscribed_apps: [],
    leadgen_subscribed: false,
    forms: [],
    errors: [],
  };

  // 1. /me
  try {
    const me = await gget(`/me?fields=id,name`);
    if (!me.ok) {
      result.errors.push({ step: "me", details: me.body });
      diagnostico.push(`❌ Token inválido: ${me.body?.error?.message || "erro desconhecido"}`);
    } else {
      result.token_ok = true;
      result.page_id_token = me.body.id;
      result.page_name = me.body.name;
      diagnostico.push(`✅ Token OK — Página: ${me.body.name} (${me.body.id})`);
    }
  } catch (e) {
    result.errors.push({ step: "me", details: (e as Error).message });
    diagnostico.push(`❌ Falha ao chamar /me: ${(e as Error).message}`);
  }

  // 2. /{page}/subscribed_apps
  if (result.page_id_token) {
    try {
      const sub = await gget(`/${result.page_id_token}/subscribed_apps`);
      if (!sub.ok) {
        result.errors.push({ step: "subscribed_apps", details: sub.body });
        diagnostico.push(`❌ Erro ao listar apps subscritos: ${sub.body?.error?.message}`);
      } else {
        const apps = (sub.body.data ?? []) as any[];
        result.subscribed_apps = apps.map((a) => ({
          app_id: a.id,
          name: a.name,
          subscribed_fields: a.subscribed_fields ?? [],
        }));
        result.leadgen_subscribed = apps.some((a) =>
          (a.subscribed_fields ?? []).includes("leadgen"),
        );
        if (apps.length === 0) {
          diagnostico.push(`❌ Nenhum app subscrito a esta Página`);
        } else if (result.leadgen_subscribed) {
          diagnostico.push(`✅ Campo "leadgen" subscrito (${apps.length} app${apps.length > 1 ? "s" : ""})`);
        } else {
          diagnostico.push(`⚠️ ${apps.length} app(s) subscrito(s), mas NENHUM com campo "leadgen"`);
        }
      }
    } catch (e) {
      result.errors.push({ step: "subscribed_apps", details: (e as Error).message });
    }

    // 3. /{page}/leadgen_forms
    try {
      const forms = await gget(`/${result.page_id_token}/leadgen_forms?fields=id,name,status&limit=50`);
      if (!forms.ok) {
        result.errors.push({ step: "leadgen_forms", details: forms.body });
        diagnostico.push(`⚠️ Não foi possível listar formulários: ${forms.body?.error?.message}`);
      } else {
        result.forms = (forms.body.data ?? []) as any[];
        const ativos = result.forms.filter((f: any) => f.status === "ACTIVE").length;
        diagnostico.push(`📋 ${result.forms.length} formulário(s) encontrado(s) — ${ativos} ativo(s)`);
      }
    } catch (e) {
      result.errors.push({ step: "leadgen_forms", details: (e as Error).message });
    }
  }

  result.diagnostico = diagnostico;
  result.ok = result.token_ok && result.leadgen_subscribed;

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
