// Trigger a test lead via Graph API: POST /{form_id}/test_leads
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

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body ok */ }
  const form_id = String(body?.form_id ?? "").trim();
  if (!/^\d{6,}$/.test(form_id)) {
    return new Response(JSON.stringify({ ok: false, error: "form_id inválido" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    // field_data is optional; Meta will fill defaults. We provide minimal sample.
    const field_data = JSON.stringify([
      { name: "full_name", values: ["Lead Teste CRM"] },
      { name: "email", values: ["teste-crm@example.com"] },
      { name: "phone_number", values: ["+5566999999999"] },
    ]);

    const url = `${GRAPH}/${form_id}/test_leads`;
    const params = new URLSearchParams({
      access_token: PAGE_TOKEN,
      field_data,
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const json = await res.json();

    return new Response(
      JSON.stringify({
        ok: res.ok,
        status: res.status,
        form_id,
        meta_response: json,
        hint: res.ok
          ? "Lead de teste disparado. Aguarde alguns segundos e confira a aba Leads."
          : "Meta retornou erro — confira a mensagem em meta_response.error.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
