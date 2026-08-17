// Endpoint público dos links temporários de imóveis (/l/:token).
// Nunca expõe dados internos: endereço completo, proprietário, corretor, matrícula, etc.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, pragma",
};

const SHARED_BUCKET = "imoveis-compartilhados";
const SIGNED_TTL = 60 * 60; // 1h

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseUA(ua: string) {
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const navegador = /Edg\//.test(ua) ? "Edge"
    : /OPR\//.test(ua) ? "Opera"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : /Firefox\//.test(ua) ? "Firefox"
    : "Outro";
  const so = /Android/i.test(ua) ? "Android"
    : /iPhone|iPad|iOS/i.test(ua) ? "iOS"
    : /Windows/i.test(ua) ? "Windows"
    : /Mac OS/i.test(ua) ? "macOS"
    : /Linux/i.test(ua) ? "Linux"
    : "Outro";
  return { dispositivo: mobile ? "mobile" : "desktop", navegador, sistema_operacional: so };
}

function extractPath(url: string): string | null {
  const m = String(url).match(/\/imoveis(?:-compartilhados)?\/(.+?)(?:\?.*)?$/);
  return m ? m[1] : url.startsWith("http") ? null : String(url);
}

const EVENTOS_VALIDOS = new Set([
  "abertura", "visualizacao_imovel", "clique_whatsapp",
  "copiar_link", "compartilhamento_nativo",
  "gostei", "rejeitou", "solicitou_informacoes", "solicitou_visita",
]);

// Ações do cliente: 1 registro por visitante/item/tipo (idempotência)
const EVENTOS_UNICOS = new Set(["gostei", "rejeitou", "solicitou_informacoes", "solicitou_visita"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const action = typeof body.action === "string" ? body.action : "open";
  if (!token || token.length < 8 || token.length > 128) return json({ error: "Token inválido" }, 400);

  const ua = req.headers.get("user-agent") ?? "";
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const visitorSeed = typeof body.visitor_id === "string" ? body.visitor_id : `${ip}|${ua}`;
  const visitorHash = await sha256(`${token}|${visitorSeed}`);
  const sessionHash = typeof body.session_id === "string"
    ? await sha256(`${token}|${body.session_id}`)
    : null;
  const { dispositivo, navegador, sistema_operacional } = parseUA(ua);

  const { data: link, error: linkErr } = await supabase
    .from("imovel_links_compartilhados")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (linkErr) return json({ error: "Falha ao consultar o link" }, 500);
  if (!link) return json({ status: "invalido" }, 404);

  const now = new Date();

  if (link.estado_operacional === "revogado" || link.revogado_em) {
    return json({ status: "revogado", codigo_referencia: link.codigo_referencia });
  }

  // Início da validade: na criação ou no primeiro acesso
  let validadeIniciadaEm: string | null = link.validade_iniciada_em ?? null;
  let expiraEm: string | null = link.expira_em ?? null;
  const minutos = Number(link.validade_minutos ?? 0);

  if (!validadeIniciadaEm) {
    if (link.inicio_validade === "criacao") {
      validadeIniciadaEm = link.created_at;
    } else if (action === "open") {
      validadeIniciadaEm = now.toISOString();
    }
  }
  if (validadeIniciadaEm && minutos > 0) {
    expiraEm = new Date(new Date(validadeIniciadaEm).getTime() + minutos * 60_000).toISOString();
  }

  if (expiraEm && new Date(expiraEm) <= now) {
    if (action !== "open") {
      // Idempotência das ações do cliente
  if (tipoEvento && EVENTOS_UNICOS.has(tipoEvento)) {
    let q = supabase
      .from("imovel_link_eventos")
      .select("id", { count: "exact", head: true })
      .eq("link_id", link.id)
      .eq("tipo_evento", tipoEvento)
      .eq("visitor_id_hash", visitorHash);
    q = typeof body.item_id === "string"
      ? q.eq("item_id", body.item_id)
      : q.is("item_id", null);
    const { count: jaExiste } = await q;
    if ((jaExiste ?? 0) > 0) return json({ status: "ok", duplicado: true });
  }

  await supabase.from("imovel_link_eventos").insert({
        link_id: link.id,
        item_id: typeof body.item_id === "string" ? body.item_id : null,
        tipo_evento: "tentativa_apos_expiracao",
        visitor_id_hash: visitorHash,
        session_id_hash: sessionHash,
        dispositivo,
        navegador,
        sistema_operacional,
        user_agent: ua.slice(0, 500),
        metadata: { acao: typeof body.tipo_evento === "string" ? body.tipo_evento : null },
      });
    }
    if (link.estado_operacional !== "expirado") {
      await supabase.from("imovel_links_compartilhados")
        .update({ estado_operacional: "expirado", expira_em: expiraEm, validade_iniciada_em: validadeIniciadaEm })
        .eq("id", link.id);
    }
    return json({ status: "expirado", codigo_referencia: link.codigo_referencia, expira_em: expiraEm });
  }

  // Registro de evento (inclui a abertura)
  const tipoEvento = action === "open"
    ? "abertura"
    : (typeof body.tipo_evento === "string" && EVENTOS_VALIDOS.has(body.tipo_evento) ? body.tipo_evento : null);

  if (action !== "open" && !tipoEvento) return json({ error: "Evento inválido" }, 400);

  // Idempotência das ações do cliente
  if (tipoEvento && EVENTOS_UNICOS.has(tipoEvento)) {
    let q = supabase
      .from("imovel_link_eventos")
      .select("id", { count: "exact", head: true })
      .eq("link_id", link.id)
      .eq("tipo_evento", tipoEvento)
      .eq("visitor_id_hash", visitorHash);
    q = typeof body.item_id === "string"
      ? q.eq("item_id", body.item_id)
      : q.is("item_id", null);
    const { count: jaExiste } = await q;
    if ((jaExiste ?? 0) > 0) return json({ status: "ok", duplicado: true });
  }

  await supabase.from("imovel_link_eventos").insert({
    link_id: link.id,
    item_id: typeof body.item_id === "string" ? body.item_id : null,
    tipo_evento: tipoEvento,
    visitor_id_hash: visitorHash,
    session_id_hash: sessionHash,
    dispositivo,
    navegador,
    sistema_operacional,
    referrer: req.headers.get("referer"),
    user_agent: ua.slice(0, 500),
    metadata: (body.metadata && typeof body.metadata === "object") ? body.metadata : {},
  });

  if (action === "open") {
    const { count } = await supabase
      .from("imovel_link_eventos")
      .select("visitor_id_hash", { count: "exact", head: true })
      .eq("link_id", link.id)
      .eq("visitor_id_hash", visitorHash);

    const novoVisitante = (count ?? 0) <= 1;

    await supabase.from("imovel_links_compartilhados").update({
      validade_iniciada_em: validadeIniciadaEm,
      expira_em: expiraEm,
      primeiro_acesso_em: link.primeiro_acesso_em ?? now.toISOString(),
      ultimo_acesso_em: now.toISOString(),
      total_acessos: (link.total_acessos ?? 0) + 1,
      visitantes_unicos: (link.visitantes_unicos ?? 0) + (novoVisitante ? 1 : 0),
      estado_operacional: "ativo",
    }).eq("id", link.id);
  }

  if (action !== "open") return json({ status: "ok" });

  // Conteúdo público
  const { data: itens } = await supabase
    .from("imovel_link_itens")
    .select("id, imovel_id, ordem, configuracao_publica")
    .eq("link_id", link.id)
    .order("ordem", { ascending: true });

  const ids = (itens ?? []).map((i) => i.imovel_id);
  const [{ data: imoveis }, { data: configs }] = await Promise.all([
    supabase.from("imoveis").select(
      "id, titulo, tipo, finalidade, valor, valor_condominio, valor_iptu, bairro, cidade, estado, area_util, area_total, area_construida, quartos, suites, banheiros, vagas, caracteristicas, fotos, descricao",
    ).in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("imovel_apresentacao_config").select("*")
      .in("imovel_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const cfgMap = new Map((configs ?? []).map((c) => [c.imovel_id, c]));
  const imovelMap = new Map((imoveis ?? []).map((i) => [i.id, i]));

  const payloadItens = [];
  for (const item of itens ?? []) {
    const im = imovelMap.get(item.imovel_id);
    if (!im) continue;
    const cfg = cfgMap.get(item.imovel_id) ?? {};
    const over = (item.configuracao_publica ?? {}) as Record<string, unknown>;

    const exibirValor = over.exibir_valor ?? cfg.exibir_valor_padrao ?? true;
    const localizacao = (over.localizacao ?? cfg.localizacao_padrao ?? "bairro_cidade") as string;

    const fontes: string[] = (cfg.fotos_publicas?.length ? cfg.fotos_publicas : im.fotos) ?? [];
    const paths = fontes.map(extractPath).filter(Boolean) as string[];
    let fotos: string[] = [];
    if (paths.length) {
      const { data: signed } = await supabase.storage.from(SHARED_BUCKET).createSignedUrls(paths, SIGNED_TTL);
      fotos = (signed ?? []).map((s, idx) => s?.signedUrl || fontes[idx]).filter(Boolean) as string[];
    }
    if (!fotos.length) fotos = fontes;

    payloadItens.push({
      item_id: item.id,
      titulo: im.titulo,
      tipo: im.tipo,
      finalidade: im.finalidade,
      valor: exibirValor ? im.valor : null,
      valor_condominio: exibirValor ? im.valor_condominio : null,
      valor_iptu: exibirValor ? im.valor_iptu : null,
      localizacao: localizacao === "oculto"
        ? null
        : localizacao === "cidade"
          ? [im.cidade, im.estado].filter(Boolean).join(" - ")
          : [im.bairro, im.cidade].filter(Boolean).join(", "),
      area_util: im.area_util,
      area_total: im.area_total,
      area_construida: im.area_construida,
      quartos: im.quartos,
      suites: im.suites,
      banheiros: im.banheiros,
      vagas: im.vagas,
      caracteristicas: im.caracteristicas ?? [],
      descricao: cfg.descricao_publica ?? im.descricao ?? null,
      video_url: cfg.video_url ?? null,
      condicoes_comerciais: cfg.condicoes_comerciais_publicas ?? null,
      fotos,
    });
  }

  let corretor: { nome: string | null; telefone: string | null } | null = null;
  if (link.corretor_id) {
    const { data: p } = await supabase.from("profiles")
      .select("nome, telefone").or(`user_id.eq.${link.corretor_id},id.eq.${link.corretor_id}`).maybeSingle();
    if (p) corretor = { nome: p.nome ?? null, telefone: p.telefone ?? null };
  }

  return json({
    status: "ativo",
    tipo: link.tipo,
    codigo_referencia: link.codigo_referencia,
    titulo: link.titulo_selecao,
    mensagem: link.mensagem_apresentacao,
    expira_em: expiraEm,
    configuracao_publica: link.configuracao_publica ?? {},
    corretor,
    itens: payloadItens,
  });
});
