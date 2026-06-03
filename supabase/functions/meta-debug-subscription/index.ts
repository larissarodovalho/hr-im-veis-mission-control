// Meta — diagnostic: checks Page Access Token, subscribed_apps and leadgen_forms
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PAGE_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN") || "";
const GRAPH = "https://graph.facebook.com/v21.0";

async function resolveHRPageToken(token: string) {
  const meRes = await fetch(`${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
  const me = await meRes.json();
  if (!meRes.ok) return { error: me?.error?.message || "Token inválido", details: me };
  if (me.id?.endsWith("99")) return { pageId: me.id, pageName: me.name, token };
  const accRes = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token&limit=100&access_token=${encodeURIComponent(token)}`);
  const acc = await accRes.json();
  const pages = (acc?.data ?? []) as any[];
  const hr = pages.find((p) => p.id?.endsWith("99")) ?? pages.find((p) => /hr\s*im[oó]veis/i.test(p.name ?? ""));
  if (!hr) return { error: "Página HR Imóveis não encontrada nas contas do token", details: acc };
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

  const resolved = await resolveHRPageToken(PAGE_TOKEN);
  if ("error" in resolved) {
    result.errors.push({ step: "resolve_page", details: resolved.details });
    diagnostico.push(`❌ ${resolved.error}`);
    result.diagnostico = diagnostico;
    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const pageToken = resolved.token;
  result.token_ok = true;
  result.page_id_token = resolved.pageId;
  result.page_name = resolved.pageName;
  diagnostico.push(`✅ Token OK — Página: ${resolved.pageName} (${resolved.pageId})`);

  async function gget(path: string) {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${GRAPH}${path}${sep}access_token=${encodeURIComponent(pageToken)}`);
    const body = await res.json();
    return { ok: res.ok, body };
  }

  try {
    const sub = await gget(`/${resolved.pageId}/subscribed_apps`);
    if (!sub.ok) {
      result.errors.push({ step: "subscribed_apps", details: sub.body });
      diagnostico.push(`❌ Erro ao listar apps subscritos: ${sub.body?.error?.message}`);
    } else {
      const apps = (sub.body.data ?? []) as any[];
      result.subscribed_apps = apps.map((a) => ({
        app_id: a.id, name: a.name, subscribed_fields: a.subscribed_fields ?? [],
      }));
      result.leadgen_subscribed = apps.some((a) => (a.subscribed_fields ?? []).includes("leadgen"));
      if (apps.length === 0) diagnostico.push(`❌ Nenhum app subscrito a esta Página`);
      else if (result.leadgen_subscribed) diagnostico.push(`✅ Campo "leadgen" subscrito (${apps.length} app${apps.length > 1 ? "s" : ""})`);
      else diagnostico.push(`⚠️ ${apps.length} app(s) subscrito(s), mas NENHUM com campo "leadgen"`);
    }
  } catch (e) {
    result.errors.push({ step: "subscribed_apps", details: (e as Error).message });
  }

  try {
    const forms = await gget(`/${resolved.pageId}/leadgen_forms?fields=id,name,status&limit=50`);
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

  result.diagnostico = diagnostico;
  result.ok = result.token_ok && result.leadgen_subscribed;

  return new Response(JSON.stringify(result), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
