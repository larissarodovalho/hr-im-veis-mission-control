// Envia alerta por email para os admins quando um lead pede contato imediato.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Internal-only: require service role bearer token
  const _auth = req.headers.get("Authorization");
  if (_auth !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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

    // Pega admins via user_roles + profiles
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = (adminRoles ?? []).map((r: any) => r.user_id);
    let recipients: { email: string; nome?: string }[] = [];
    if (adminIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, nome")
        .in("user_id", adminIds);
      recipients = (profiles ?? []).filter((p: any) => p.email);
    }

    // Fallback: se não houver admins cadastrados, usa Hans direto.
    if (recipients.length === 0) {
      recipients = [{ email: "larissadefreitas@hotmail.com", nome: "Hans" }];
    }

    const interest = (lead.observacoes || "").match(/Intenção:\s*([^\n]+)/i)?.[1]?.trim() || "—";
    const baseUrl = Deno.env.get("PUBLIC_APP_URL")
      || "https://id-preview--9ba329fa-bc86-4fa7-8521-f11e9da54abe.lovable.app";
    const leadUrl = `${baseUrl.replace(/\/$/, "")}/leads/${lead.id}`;

    const results: any[] = [];
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
      results.push({ to: r.email, ok: !error, error: error?.message, data });
    }

    return new Response(JSON.stringify({ ok: true, sent: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-immediate-contact error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
