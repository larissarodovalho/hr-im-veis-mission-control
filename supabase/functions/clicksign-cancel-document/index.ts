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

    const { document_id } = await req.json();
    if (!document_id) return json({ error: "document_id obrigatório" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    // Busca com o cliente do usuário: as regras de acesso decidem se ele pode ver o documento
    const { data: doc } = await userClient.from("signed_documents")
      .select("id, clicksign_document_key").eq("id", document_id).maybeSingle();
    if (!doc?.clicksign_document_key) return json({ error: "documento não encontrado" }, 404);

    await clicksignFetch(`/documents/${doc.clicksign_document_key}/cancel`, { method: "PATCH" });

    await admin.from("signed_documents").update({
      status: "canceled", canceled_at: new Date().toISOString(),
    }).eq("id", document_id);

    await admin.from("document_events").insert({
      document_id, event_type: "canceled_by_user", event_data: {},
    });

    return json({ ok: true });
  } catch (e: any) {
    console.error("clicksign-cancel-document error:", e);
    return json({ error: "Não foi possível concluir a operação. Tente novamente." }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
