// Edge Function: whatsapp-instance
// Gerencia a conexão da instância Evolution: status, QR Code, restart, logout, webhook.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Action =
  | "status"
  | "qrcode"
  | "restart"
  | "logout"
  | "set-webhook"
  | "find-webhook";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // --- auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    // só admin/gestor
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "gestor");
    if (!isAdmin) return json({ error: "Acesso restrito a administradores" }, 403);

    // --- evolution config ---
    const apiUrl = (Deno.env.get("EVOLUTION_API_URL") || "").replace(/\/+$/, "");
    const apiKey = Deno.env.get("EVOLUTION_API_KEY") || "";
    const instance = Deno.env.get("EVOLUTION_INSTANCE_NAME") || "";
    if (!apiUrl || !apiKey || !instance) {
      return json({ error: "EVOLUTION_API_URL/KEY/INSTANCE não configurados" }, 500);
    }

    const body = (await req.json().catch(() => ({}))) as { action?: Action };
    const action = body.action;
    if (!action) return json({ error: "action obrigatório" }, 400);

    const headers = { apikey: apiKey, "Content-Type": "application/json" };
    const projectRef = (Deno.env.get("SUPABASE_URL") || "").match(/https:\/\/([^.]+)\./)?.[1] ?? "";
    const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/whatsapp-webhook`;

    let url = "";
    let init: RequestInit = { headers };

    switch (action) {
      case "status":
        url = `${apiUrl}/instance/connectionState/${instance}`;
        init = { method: "GET", headers };
        break;
      case "qrcode":
        url = `${apiUrl}/instance/connect/${instance}`;
        init = { method: "GET", headers };
        break;
      case "restart":
        url = `${apiUrl}/instance/restart/${instance}`;
        init = { method: "PUT", headers };
        break;
      case "logout":
        url = `${apiUrl}/instance/logout/${instance}`;
        init = { method: "DELETE", headers };
        break;
      case "set-webhook":
        url = `${apiUrl}/webhook/set/${instance}`;
        init = {
          method: "POST",
          headers,
          body: JSON.stringify({
            webhook: {
              enabled: true,
              url: webhookUrl,
              webhook_by_events: false,
              webhook_base64: false,
              events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
            },
            // formato legado (Evolution antigas)
            url: webhookUrl,
            enabled: true,
            events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
          }),
        };
        break;
      case "find-webhook":
        url = `${apiUrl}/webhook/find/${instance}`;
        init = { method: "GET", headers };
        break;
      default:
        return json({ error: "action inválido" }, 400);
    }

    const res = await fetch(url, init);
    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }

    if (!res.ok) {
      return json({ error: "Evolution retornou erro", status: res.status, data, webhookUrl }, 200);
    }

    return json({ ok: true, data, webhookUrl });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
