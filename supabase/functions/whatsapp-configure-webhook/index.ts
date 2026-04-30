import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const normalizeEvolutionBaseUrl = (value: string) => {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  return url.origin;
};

// Some setups store the secret as the full webhook URL. Extract just the token in that case.
const extractSecretToken = (raw: string) => {
  const trimmed = raw.trim();
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const u = new URL(trimmed);
      const fromQuery = u.searchParams.get("secret");
      if (fromQuery) return fromQuery;
    }
  } catch (_) { /* noop */ }
  return trimmed;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: userRes } = await supabase.auth.getUser(token);
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifica se é admin/gestor
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin" || r.role === "gestor");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem reconfigurar o webhook" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiUrl = Deno.env.get("EVOLUTION_API_URL");
    const apiKey = Deno.env.get("EVOLUTION_API_KEY");
    const instance = Deno.env.get("EVOLUTION_INSTANCE") || Deno.env.get("EVOLUTION_INSTANCE_NAME");
    const rawSecret = Deno.env.get("WHATSAPP_WEBHOOK_SECRET");

    const missing: string[] = [];
    if (!apiUrl) missing.push("EVOLUTION_API_URL");
    if (!apiKey) missing.push("EVOLUTION_API_KEY");
    if (!instance) missing.push("EVOLUTION_INSTANCE");
    if (!rawSecret) missing.push("WHATSAPP_WEBHOOK_SECRET");

    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: `Secrets ausentes: ${missing.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const baseUrl = normalizeEvolutionBaseUrl(apiUrl!);
    const secretToken = extractSecretToken(rawSecret!);
    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook?secret=${encodeURIComponent(secretToken)}`;

    const events = [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "CONNECTION_UPDATE",
      "SEND_MESSAGE",
    ];

    // Tenta os dois formatos comuns da Evolution API (v1 e v2).
    const attempts: Array<{ label: string; payload: unknown }> = [
      {
        label: "v2",
        payload: {
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: false,
            webhookBase64: false,
            events,
          },
        },
      },
      {
        label: "v1",
        payload: {
          enabled: true,
          url: webhookUrl,
          webhook_by_events: false,
          webhook_base64: false,
          events,
        },
      },
    ];

    let lastError: any = null;
    let success: any = null;

    for (const attempt of attempts) {
      const resp = await fetch(`${baseUrl}/webhook/set/${encodeURIComponent(instance!)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey!,
        },
        body: JSON.stringify(attempt.payload),
      });
      const text = await resp.text();
      if (resp.ok) {
        success = { format: attempt.label, response: safeJson(text) };
        break;
      }
      lastError = { format: attempt.label, status: resp.status, body: text };
    }

    if (!success) {
      return new Response(
        JSON.stringify({
          error: "Falha ao configurar webhook na Evolution API",
          webhookUrl,
          lastError,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verifica status da conexão da instância
    let connectionState: any = null;
    try {
      const stateResp = await fetch(
        `${baseUrl}/instance/connectionState/${encodeURIComponent(instance!)}`,
        { headers: { apikey: apiKey! } },
      );
      if (stateResp.ok) connectionState = safeJson(await stateResp.text());
    } catch (_) { /* noop */ }

    return new Response(
      JSON.stringify({
        success: true,
        webhookUrl,
        events,
        instance,
        format: success.format,
        connectionState,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[whatsapp-configure-webhook] erro:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return text; }
}
