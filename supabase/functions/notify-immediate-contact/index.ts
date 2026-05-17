// Envia alerta por email + WhatsApp para os admins quando um lead pede contato imediato.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizePhone(p: string): string {
  let digits = String(p || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 11 && !digits.startsWith("55")) digits = "55" + digits;
  return digits;
}

function kindLabel(k: string): string {
  return k === "ligacao" ? "ligação"
    : k === "videochamada" ? "videochamada"
    : k === "presencial" ? "presencial"
    : k === "whatsapp" ? "WhatsApp"
    : k;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lead_id, contact_kind } = await req.json();
    if (!lead_id || !contact_kind) {
      return new Response(JSON.stringify({ error: "lead_id e contact_kind obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: lead } = await supabase
      .from("leads")
      .select("id, nome, telefone, observacoes")
      .eq("id", lead_id)
      .maybeSingle();

    if (!lead) {
      return new Response(JSON.stringify({ error: "lead não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pega admins via user_roles + profiles (email + telefone)
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = (adminRoles ?? []).map((r: any) => r.user_id);
    let recipients: { email: string; nome?: string; telefone?: string | null }[] = [];
    if (adminIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, nome, telefone")
        .in("user_id", adminIds);
      recipients = (profiles ?? []).filter((p: any) => p.email);
    }

    // Fallback: se não houver admins cadastrados, usa Hans direto.
    if (recipients.length === 0) {
      recipients = [{ email: "larissadefreitas@hotmail.com", nome: "Hans", telefone: null }];
    }

    const interest = (lead.observacoes || "").match(/Intenção:\s*([^\n]+)/i)?.[1]?.trim() || "—";
    const baseUrl = Deno.env.get("PUBLIC_APP_URL")
      || "https://id-preview--9ba329fa-bc86-4fa7-8521-f11e9da54abe.lovable.app";
    const leadUrl = `${baseUrl.replace(/\/$/, "")}/leads/${lead.id}`;

    // --- Envio de email ---
    const emailResults: any[] = [];
    for (const r of recipients) {
      const { data, error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "immediate-contact-alert",
          recipientEmail: r.email,
          idempotencyKey: `immediate-${lead.id}-${Date.now()}`,
          purpose: "transactional",
          templateData: {
            leadName: lead.nome || "Novo lead",
            leadPhone: lead.telefone || "—",
            interest,
            contactKind: contact_kind,
            leadUrl,
          },
        },
      });
      emailResults.push({ to: r.email, ok: !error, error: error?.message, data });
    }

    // --- Envio de WhatsApp para admins com telefone cadastrado ---
    const waMessage =
      `🔥 Lead quente pedindo contato AGORA\n\n` +
      `Nome: ${lead.nome || "—"}\n` +
      `Telefone: ${lead.telefone || "—"}\n` +
      `Canal preferido: ${kindLabel(contact_kind)}\n` +
      `Interesse: ${interest}\n\n` +
      `Abrir lead: ${leadUrl}`;

    const waTargets = recipients
      .map((r) => ({ nome: r.nome, phone: normalizePhone(r.telefone || "") }))
      .filter((r) => r.phone.length >= 12);

    const waResults = await Promise.allSettled(
      waTargets.map((t) =>
        supabase.functions.invoke("whatsapp-send", {
          body: { phone: t.phone, message: waMessage },
        }).then((res) => ({ to: t.phone, ok: !res.error, error: res.error?.message }))
      ),
    );
    const wa = waResults.map((r) =>
      r.status === "fulfilled" ? r.value : { ok: false, error: String(r.reason) }
    );

    if (waTargets.length === 0) {
      console.warn("[notify-immediate-contact] nenhum admin com telefone cadastrado em profiles.telefone — WhatsApp não enviado");
    }

    return new Response(JSON.stringify({ ok: true, email: emailResults, whatsapp: wa }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-immediate-contact error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
