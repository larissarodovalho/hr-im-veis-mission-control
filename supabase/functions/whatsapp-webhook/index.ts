import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Webhook público da Evolution API. Configure na Evolution apontando para:
// https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    console.log("Evolution webhook:", JSON.stringify(payload).slice(0, 500));

    const event = payload?.event;
    const data = payload?.data;
    if (!event || !data) {
      return new Response(JSON.stringify({ ok: true, ignored: "no data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event !== "messages.upsert" && event !== "MESSAGES_UPSERT") {
      return new Response(JSON.stringify({ ok: true, ignored: event }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const remoteJid: string = data?.key?.remoteJid || "";
    const fromMe: boolean = !!data?.key?.fromMe;
    const phone = remoteJid.split("@")[0]?.replace(/\D/g, "");
    if (!phone) {
      return new Response(JSON.stringify({ ok: true, ignored: "no phone" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.message?.imageMessage?.caption ||
      data?.message?.videoMessage?.caption ||
      "[mídia]";

    const pushName = data?.pushName || null;
    const externalId = data?.key?.id || null;
    const ts = data?.messageTimestamp ? new Date(Number(data.messageTimestamp) * 1000).toISOString() : new Date().toISOString();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert conversa
    const { data: existing } = await supabase
      .from("whatsapp_conversations")
      .select("id, unread_count")
      .eq("phone", phone)
      .maybeSingle();

    let convId: string;
    if (existing?.id) {
      convId = existing.id;
      await supabase.from("whatsapp_conversations").update({
        last_message_at: ts,
        last_message_preview: content,
        contact_name: pushName ?? undefined,
        unread_count: fromMe ? existing.unread_count : (existing.unread_count ?? 0) + 1,
      }).eq("id", convId);
    } else {
      const { data: created } = await supabase
        .from("whatsapp_conversations")
        .insert({
          phone,
          contact_name: pushName,
          last_message_at: ts,
          last_message_preview: content,
          unread_count: fromMe ? 0 : 1,
        })
        .select("id").single();
      convId = created!.id;
    }

    const { data: msgRow } = await supabase.from("whatsapp_messages").insert({
      conversation_id: convId,
      external_id: externalId,
      direction: fromMe ? "outbound" : "inbound",
      content,
      status: "delivered",
      timestamp: ts,
    }).select("id").single();

    // IA: tentar criar agendamento automático em mensagens recebidas
    if (!fromMe && content && content !== "[mídia]") {
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/agenda-ai-parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
          body: JSON.stringify({
            conversation_id: convId,
            message_id: msgRow?.id,
            content,
            phone,
            contact_name: pushName,
          }),
        });
      } catch (e) {
        console.error("falha ao chamar agenda-ai-parse:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("whatsapp-webhook error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
