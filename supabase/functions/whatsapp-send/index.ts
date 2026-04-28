import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userRes } = await supabase.auth.getUser(token);
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { conversation_id, content, phone: directPhone, message: legacyMessage } = body ?? {};
    const messageText = (content ?? legacyMessage ?? "").toString().trim();

    if (!messageText || (!conversation_id && !directPhone)) {
      return new Response(JSON.stringify({ error: "campos obrigatórios: content + conversation_id (ou phone)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let conv: { id: string; phone: string } | null = null;
    if (conversation_id) {
      const { data } = await supabase
        .from("whatsapp_conversations")
        .select("id, phone")
        .eq("id", conversation_id)
        .single();
      conv = data as any;
      if (!conv) {
        return new Response(JSON.stringify({ error: "Conversa não encontrada" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const cleanPhone = String(conv?.phone ?? directPhone ?? "").replace(/\D/g, "");

    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    let sendOk = false;
    let sendError: string | null = null;
    let evoData: any = null;

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      sendError = "Evolution API não configurada (EVOLUTION_API_URL/KEY/INSTANCE_NAME).";
    } else {
      try {
        const baseUrl = EVOLUTION_API_URL.replace(/\/$/, "");
        const evoRes = await fetch(`${baseUrl}/message/sendText/${EVOLUTION_INSTANCE_NAME}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
          body: JSON.stringify({ number: cleanPhone, text: messageText }),
        });
        evoData = await evoRes.json().catch(() => ({}));
        if (!evoRes.ok) {
          sendError = `Evolution: ${evoRes.status} ${JSON.stringify(evoData).slice(0, 200)}`;
        } else {
          sendOk = true;
        }
      } catch (e) {
        sendError = e instanceof Error ? e.message : "Falha ao chamar Evolution";
      }
    }

    let convId = conv?.id ?? null;
    if (!convId) {
      const { data: upserted } = await supabase
        .from("whatsapp_conversations")
        .upsert(
          { phone: cleanPhone, last_message_at: new Date().toISOString(), last_message_preview: messageText },
          { onConflict: "phone" }
        )
        .select("id").single();
      convId = upserted?.id ?? null;
    } else {
      await supabase.from("whatsapp_conversations").update({
        last_message_at: new Date().toISOString(),
        last_message_preview: messageText,
      }).eq("id", convId);
    }

    if (convId) {
      await supabase.from("whatsapp_messages").insert({
        conversation_id: convId,
        external_id: evoData?.key?.id,
        direction: "outbound",
        author: "humano",
        content: messageText,
        status: sendOk ? "sent" : "failed",
        timestamp: new Date().toISOString(),
      });
    }

    if (!sendOk) {
      return new Response(JSON.stringify({ ok: false, error: sendError, saved: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, success: true, conversation_id: convId, evolution: evoData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("whatsapp-send error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
