import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { clicksignFetch } from "../_shared/clicksign.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: claims, error } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (error || !claims?.claims) return json({ error: "Não autorizado" }, 401);

    const { signer_id } = await req.json();
    if (!signer_id) return json({ error: "signer_id obrigatório" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: signer } = await admin.from("document_signers")
      .select("id, sign_url, clicksign_signer_key, document_id")
      .eq("id", signer_id).maybeSingle();
    if (!signer) return json({ error: "signatário não encontrado" }, 404);

    const reqKey = signer.sign_url?.split("/").pop();
    if (!reqKey) return json({ error: "sem request_signature_key" }, 400);

    await clicksignFetch("/notifications", {
      method: "POST",
      body: JSON.stringify({ request_signature_key: reqKey }),
    });

    await admin.from("document_events").insert({
      document_id: signer.document_id,
      signer_id: signer.id,
      event_type: "notification_resent",
      event_data: {},
    });
    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e.message || String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
