import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      return new Response(JSON.stringify({ error: "Evolution API não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { phone, message, conversation_id } = await req.json();
    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "phone e message são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    const baseUrl = EVOLUTION_API_URL.replace(/\/$/, "");

    const evoRes = await fetch(`${baseUrl}/message/sendText/${EVOLUTION_INSTANCE_NAME}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: cleanPhone, text: message }),
    });

    const evoData = await evoRes.json();
    if (!evoRes.ok) {
      console.error("Evolution error:", evoData);
      return new Response(JSON.stringify({ error: "Falha no envio", details: evoData }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persistir mensagem
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let convId = conversation_id;
    if (!convId) {
      const { data: conv } = await supabase
        .from("whatsapp_conversations")
        .upsert({ phone: cleanPhone, last_message_at: new Date().toISOString(), last_message_preview: message }, { onConflict: "phone" })
        .select("id").single();
      convId = conv?.id;
    } else {
      await supabase.from("whatsapp_conversations").update({
        last_message_at: new Date().toISOString(),
        last_message_preview: message,
      }).eq("id", convId);
    }

    await supabase.from("whatsapp_messages").insert({
      conversation_id: convId,
      external_id: evoData?.key?.id,
      direction: "outbound",
      content: message,
      status: "sent",
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, conversation_id: convId, evolution: evoData }), {
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
