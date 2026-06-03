// Meta Lead Ads webhook — receives leadgen events and inserts into public.leads
// verify_jwt = false (public endpoint, validated via X-Hub-Signature-256)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN")!;
const PAGE_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN")!;
const APP_SECRET = Deno.env.get("META_APP_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GRAPH = "https://graph.facebook.com/v21.0";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function logEvent(status: string, descricao: string, metadata: Record<string, unknown> = {}) {
  try {
    await admin.from("activity_log").insert({
      tipo: "lead_meta",
      status,
      descricao,
      metadata,
    });
  } catch (e) {
    console.error("logEvent failed", e);
  }
}

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function mapFieldData(fields: Array<{ name: string; values: string[] }>) {
  const m: Record<string, string> = {};
  for (const f of fields ?? []) {
    m[f.name.toLowerCase()] = (f.values ?? [])[0] ?? "";
  }
  const pick = (...keys: string[]) => {
    for (const k of keys) if (m[k]) return m[k];
    return "";
  };
  return {
    nome: pick("full_name", "nome", "name", "first_name") || "Lead sem nome",
    email: pick("email", "e-mail") || null,
    telefone: pick("phone_number", "phone", "telefone", "celular") || null,
    cidade: pick("city", "cidade") || null,
    mensagem: pick("message", "mensagem", "observacao", "observação") || null,
    raw: m,
  };
}

async function processLeadgen(leadgenId: string, formId: string, pageId: string) {
  const res = await fetch(
    `${GRAPH}/${leadgenId}?access_token=${encodeURIComponent(PAGE_TOKEN)}`,
  );
  if (!res.ok) {
    const txt = await res.text();
    console.error("Graph API error", res.status, txt);
    await logEvent("erro", `Falha ao buscar lead ${leadgenId} na Graph API`, {
      leadgen_id: leadgenId, form_id: formId, page_id: pageId, status: res.status, error: txt,
    });
    return;
  }
  const lead = await res.json();
  const mapped = mapFieldData(lead.field_data ?? []);

  const { data: mapping } = await admin
    .from("meta_lead_forms")
    .select("*")
    .eq("form_id", formId)
    .eq("ativo", true)
    .maybeSingle();

  const respostas = (lead.field_data ?? []).map((f: { name: string; values: string[] }) => ({
    campo: f.name,
    valor: (f.values ?? []).join(", "),
  }));

  const metaFormData = {
    form_nome: mapping?.form_nome || null,
    form_id: formId,
    page_id: pageId,
    leadgen_id: leadgenId,
    respostas,
  };

  const observacoesParts = [
    mapped.mensagem ? `Mensagem: ${mapped.mensagem}` : null,
    `Form: ${mapping?.form_nome || formId}`,
    `Página: ${pageId}`,
    `Leadgen ID: ${leadgenId}`,
  ].filter(Boolean);

  const { data: inserted, error: insErr } = await admin
    .from("leads")
    .insert({
      nome: mapped.nome,
      email: mapped.email,
      telefone: mapped.telefone,
      regiao: mapped.cidade,
      origem: "meta_ads",
      etapa_funil: mapping?.etapa_funil_inicial || "Novo Lead",
      tags: mapping?.tags ?? null,
      corretor_id: mapping?.corretor_responsavel_id ?? null,
      observacoes: observacoesParts.join("\n"),
      meta_form_data: metaFormData,
      data_entrada: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insErr) {
    console.error("Insert lead error", insErr);
    await logEvent("erro", "Falha ao inserir lead do Meta no CRM", {
      leadgen_id: leadgenId, form_id: formId, page_id: pageId, error: insErr.message, fields: mapped.raw,
    });
    return;
  }

  await logEvent("ok", `Novo lead Meta Lead Ads (${mapping?.form_nome || formId})`, {
    lead_id: inserted.id, leadgen_id: leadgenId, form_id: formId, page_id: pageId,
    mapping_found: !!mapping,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);

  // ===== GET: Meta verification handshake =====
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const tokenOk = token === VERIFY_TOKEN;
    await logEvent(tokenOk ? "ok" : "erro", `Handshake GET (mode=${mode}, tokenOk=${tokenOk})`, {
      kind: "handshake", mode, tokenOk, hasChallenge: !!challenge,
    });
    if (mode === "subscribe" && tokenOk && challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }
    return new Response("forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: corsHeaders });
  }

  const rawBody = await req.text();
  const sigHeader = req.headers.get("x-hub-signature-256") || "";

  await logEvent("info", "POST recebido no webhook Meta", {
    kind: "post_received",
    bodyLength: rawBody.length,
    hasSignature: !!sigHeader,
    userAgent: req.headers.get("user-agent"),
  });

  if (APP_SECRET) {
    const expected = "sha256=" + (await hmacSha256Hex(APP_SECRET, rawBody));
    if (sigHeader !== expected) {
      console.warn("Invalid signature", { got: sigHeader, expected });
      await logEvent("erro", "Assinatura inválida em webhook Meta", {
        kind: "invalid_signature", header: sigHeader,
      });
      return new Response("ok", { status: 200, headers: corsHeaders });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    await logEvent("erro", "Payload JSON inválido no webhook Meta", { kind: "invalid_json", body: rawBody.slice(0, 500) });
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    let leadgenChanges = 0;
    for (const entry of payload.entry ?? []) {
      const pageId = entry.id;
      for (const change of entry.changes ?? []) {
        if (change.field !== "leadgen") {
          await logEvent("info", `Evento ignorado (field=${change.field})`, { kind: "non_leadgen", field: change.field, page_id: pageId });
          continue;
        }
        leadgenChanges++;
        const v = change.value ?? {};
        await processLeadgen(v.leadgen_id, v.form_id, v.page_id ?? pageId);
      }
    }
    if (leadgenChanges === 0) {
      await logEvent("info", "POST sem eventos leadgen", { kind: "no_leadgen", payload });
    }
  } catch (e) {
    console.error("Webhook processing error", e);
    await logEvent("erro", "Exceção ao processar webhook Meta", { kind: "exception", error: (e as Error).message });
  }

  return new Response("ok", { status: 200, headers: corsHeaders });
});
