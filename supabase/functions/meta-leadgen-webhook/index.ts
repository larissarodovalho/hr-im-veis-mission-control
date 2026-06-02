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
  // 1. Fetch field_data from Graph API
  const res = await fetch(
    `${GRAPH}/${leadgenId}?access_token=${encodeURIComponent(PAGE_TOKEN)}`,
  );
  if (!res.ok) {
    const txt = await res.text();
    console.error("Graph API error", res.status, txt);
    await admin.from("activity_log").insert({
      tipo: "lead_meta",
      status: "erro",
      descricao: `Falha ao buscar lead ${leadgenId}`,
      metadata: { leadgen_id: leadgenId, form_id: formId, error: txt },
    });
    return;
  }
  const lead = await res.json();
  const mapped = mapFieldData(lead.field_data ?? []);

  // 2. Find form mapping
  const { data: mapping } = await admin
    .from("meta_lead_forms")
    .select("*")
    .eq("form_id", formId)
    .eq("ativo", true)
    .maybeSingle();

  // 3. Insert into leads
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
      etapa_funil: mapping?.etapa_funil_inicial || "novo",
      tags: mapping?.tags ?? null,
      corretor_id: mapping?.corretor_responsavel_id ?? null,
      observacoes: observacoesParts.join("\n"),
      data_entrada: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insErr) {
    console.error("Insert lead error", insErr);
    await admin.from("activity_log").insert({
      tipo: "lead_meta",
      status: "erro",
      descricao: `Falha ao inserir lead do Meta`,
      metadata: { leadgen_id: leadgenId, form_id: formId, error: insErr.message, fields: mapped.raw },
    });
    return;
  }

  await admin.from("activity_log").insert({
    tipo: "lead_meta",
    status: "ok",
    descricao: `Novo lead do Meta Lead Ads (${mapping?.form_nome || formId})`,
    metadata: { lead_id: inserted.id, leadgen_id: leadgenId, form_id: formId, page_id: pageId },
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
    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }
    return new Response("forbidden", { status: 403, headers: corsHeaders });
  }

  // ===== POST: leadgen event =====
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: corsHeaders });
  }

  const rawBody = await req.text();

  // Signature validation
  const sigHeader = req.headers.get("x-hub-signature-256") || "";
  if (APP_SECRET) {
    const expected = "sha256=" + (await hmacSha256Hex(APP_SECRET, rawBody));
    if (sigHeader !== expected) {
      console.warn("Invalid signature", { got: sigHeader, expected });
      // Still return 200 to Meta to avoid retries; log it
      await admin.from("activity_log").insert({
        tipo: "lead_meta",
        status: "erro",
        descricao: "Assinatura inválida em webhook Meta",
        metadata: { header: sigHeader },
      });
      return new Response("ok", { status: 200, headers: corsHeaders });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    for (const entry of payload.entry ?? []) {
      const pageId = entry.id;
      for (const change of entry.changes ?? []) {
        if (change.field !== "leadgen") continue;
        const v = change.value ?? {};
        await processLeadgen(v.leadgen_id, v.form_id, v.page_id ?? pageId);
      }
    }
  } catch (e) {
    console.error("Webhook processing error", e);
  }

  return new Response("ok", { status: 200, headers: corsHeaders });
});
