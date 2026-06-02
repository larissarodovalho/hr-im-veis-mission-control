// Tests the meta-leadgen-webhook handshake from server-side and returns recent activity_log
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/meta-leadgen-webhook`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: claims, error: cErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (cErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Test handshake
  const challenge = `hr-${Date.now()}`;
  const handshakeUrl = `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(VERIFY_TOKEN)}&hub.challenge=${challenge}`;
  let handshakeOk = false;
  let handshakeStatus = 0;
  let handshakeBody = "";
  try {
    const r = await fetch(handshakeUrl);
    handshakeStatus = r.status;
    handshakeBody = await r.text();
    handshakeOk = r.ok && handshakeBody.trim() === challenge;
  } catch (e) {
    handshakeBody = (e as Error).message;
  }

  // 2. Recent activity_log entries for tipo=lead_meta
  const { data: logs } = await admin
    .from("activity_log")
    .select("id, status, descricao, metadata, created_at")
    .eq("tipo", "lead_meta")
    .order("created_at", { ascending: false })
    .limit(20);

  // 3. Count POSTs received
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: postsLast24h } = await admin
    .from("activity_log")
    .select("*", { count: "exact", head: true })
    .eq("tipo", "lead_meta")
    .filter("metadata->>kind", "eq", "post_received")
    .gte("created_at", since);

  return new Response(JSON.stringify({
    ok: handshakeOk,
    webhook_url: WEBHOOK_URL,
    handshake: { ok: handshakeOk, status: handshakeStatus, body: handshakeBody.slice(0, 200) },
    posts_received_last_24h: postsLast24h ?? 0,
    recent_logs: logs ?? [],
    hint: handshakeOk
      ? (postsLast24h && postsLast24h > 0
          ? "Webhook responde OK e está recebendo POSTs. Veja recent_logs para detalhes do processamento."
          : "Webhook responde OK, mas nenhum POST chegou nas últimas 24h. Verifique se a Callback URL configurada no painel da Meta é exatamente igual à webhook_url acima, e se a Página está inscrita ao App correto.")
      : "Webhook NÃO responde ao handshake. O Verify Token configurado na Meta precisa ser exatamente igual ao META_VERIFY_TOKEN.",
  }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
