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
    const token = auth.replace("Bearer ", "");
    const { data: claims, error } = await userClient.auth.getClaims(token);
    if (error || !claims?.claims) return json({ error: "Não autorizado" }, 401);
    const userId = claims.claims.sub as string;

    const { document_id } = await req.json();
    if (!document_id) return json({ error: "document_id obrigatório" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: doc } = await admin.from("signed_documents")
      .select("id, clicksign_document_key, signed_file_url")
      .eq("id", document_id).maybeSingle();
    if (!doc?.clicksign_document_key) return json({ error: "documento não encontrado" }, 404);

    const meta = await clicksignFetch(`/documents/${doc.clicksign_document_key}`);
    const downloadUrl = meta?.document?.downloads?.signed_file_url
      || meta?.document?.signed_file_url;
    if (!downloadUrl) return json({ error: "PDF assinado ainda não disponível" }, 400);

    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok) return json({ error: "falha ao baixar PDF" }, 500);
    const buf = new Uint8Array(await fileRes.arrayBuffer());
    const path = `${userId}/${document_id}/signed.pdf`;
    const up = await admin.storage.from("signed-documents").upload(path, buf, {
      contentType: "application/pdf", upsert: true,
    });
    if (up.error) return json({ error: up.error.message }, 500);

    await admin.from("signed_documents").update({ signed_file_url: path }).eq("id", document_id);

    const signed = await admin.storage.from("signed-documents").createSignedUrl(path, 3600);
    return json({ ok: true, url: signed.data?.signedUrl, path });
  } catch (e: any) {
    return json({ error: e.message || String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
