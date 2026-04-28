import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Normaliza telefone BR para o "tail" canônico de até 10 dígitos (DDD + 8).
// Resolve duplicação por presença/ausência do "9" extra ou DDI 55.
function normalizeBr(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  const noDdi = digits.length > 10 && digits.startsWith("55") ? digits.slice(2) : digits;
  if (noDdi.length === 11 && noDdi[2] === "9") return noDdi.slice(0, 2) + noDdi.slice(3);
  return noDdi.slice(-10);
}

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
    const phoneRaw = remoteJid.split("@")[0]?.replace(/\D/g, "");
    if (!phoneRaw) {
      return new Response(JSON.stringify({ ok: true, ignored: "no phone" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phoneCanonical = normalizeBr(phoneRaw);
    const tail8 = phoneCanonical.slice(-8);

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

    // Buscar conversa por tail canônico (evita duplicação por DDI/9 extra)
    const { data: convs } = await supabase
      .from("whatsapp_conversations")
      .select("id, unread_count, phone")
      .ilike("phone", `%${tail8}%`)
      .order("created_at", { ascending: true })
      .limit(5);

    let existing = convs?.[0] ?? null;

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
      // Tentar achar lead existente pelo tail antes de criar conversa nova
      let leadIdForConv: string | null = null;
      const { data: leads } = await supabase
        .from("leads")
        .select("id, telefone")
        .ilike("telefone", `%${tail8}%`)
        .limit(5);
      if (leads && leads.length > 0) {
        leadIdForConv = leads[0].id;
      }

      const { data: created } = await supabase
        .from("whatsapp_conversations")
        .insert({
          phone: phoneRaw,
          contact_name: pushName,
          last_message_at: ts,
          last_message_preview: content,
          unread_count: fromMe ? 0 : 1,
          lead_id: leadIdForConv,
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
            phone: phoneRaw,
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
