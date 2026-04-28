import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { verifyClicksignHmac } from "../_shared/clicksign.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const raw = await req.text();
  const sig = req.headers.get("Content-Hmac") || req.headers.get("content-hmac");
  const ok = await verifyClicksignHmac(raw, sig);
  if (!ok) {
    console.warn("HMAC inválido");
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return json({ error: "bad json" }, 400); }

  const eventName = payload?.event?.name as string | undefined;
  const docKey = payload?.document?.key as string | undefined;
  const signerKey = payload?.signer?.key as string | undefined;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (!docKey) return json({ ok: true, ignored: true });

  const { data: doc } = await admin.from("signed_documents")
    .select("id,status").eq("clicksign_document_key", docKey).maybeSingle();
  if (!doc) return json({ ok: true, ignored: "document not found" });

  let signerId: string | null = null;
  if (signerKey) {
    const { data: dbSigner } = await admin.from("document_signers")
      .select("id").eq("clicksign_signer_key", signerKey).maybeSingle();
    signerId = dbSigner?.id || null;
  }

  await admin.from("document_events").insert({
    document_id: doc.id,
    signer_id: signerId,
    event_type: eventName || "unknown",
    event_data: payload,
  });

  const ip = payload?.signer?.ip || payload?.event?.data?.ip || null;
  const occurredAt = payload?.event?.occurred_at || payload?.occurred_at || new Date().toISOString();

  if (eventName === "view" && signerId) {
    await admin.from("document_signers").update({
      status: "viewed", viewed_at: occurredAt, ip_address: ip,
    }).eq("id", signerId).eq("status", "pending");
  }

  if (eventName === "sign" && signerId) {
    await admin.from("document_signers").update({
      status: "signed", signed_at: occurredAt, ip_address: ip,
    }).eq("id", signerId);
    const { count } = await admin.from("document_signers")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id).neq("status", "signed");
    if ((count ?? 0) > 0) {
      await admin.from("signed_documents").update({ status: "partially_signed" }).eq("id", doc.id);
    }
  }

  if (eventName === "refusal" && signerId) {
    await admin.from("document_signers").update({ status: "refused" }).eq("id", signerId);
    await admin.from("signed_documents").update({ status: "refused" }).eq("id", doc.id);
  }

  if (eventName === "auto_close" || eventName === "close") {
    const signedUrl = payload?.document?.downloads?.signed_file_url
      || payload?.document?.signed_file_url
      || null;
    await admin.from("signed_documents").update({
      status: "signed",
      completed_at: occurredAt,
      signed_file_url: signedUrl,
    }).eq("id", doc.id);
  }

  if (eventName === "deadline" || eventName === "document_closed_deadline") {
    await admin.from("signed_documents").update({ status: "expired" }).eq("id", doc.id);
  }

  if (eventName === "cancel") {
    await admin.from("signed_documents").update({
      status: "canceled", canceled_at: occurredAt,
    }).eq("id", doc.id);
  }

  return json({ ok: true });
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
