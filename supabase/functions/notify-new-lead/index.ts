// Envia e-mail aos usuários que ativaram "Receber e-mail de novos leads" quando
// um lead é inserido. Acionada pelo trigger trg_notify_new_lead via pg_net.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { lead_id } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: lead } = await supabase
      .from("leads")
      .select("id, nome, telefone, email, origem, fonte, observacoes")
      .eq("id", lead_id)
      .maybeSingle();

    if (!lead) {
      return new Response(JSON.stringify({ error: "lead não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: recipients } = await supabase
      .from("profiles")
      .select("user_id, email, nome")
      .eq("notify_new_leads", true);

    const list = (recipients ?? []).filter((p: any) => p.email);
    if (list.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const interest = (lead.observacoes || "").match(/Intenção:\s*([^\n]+)/i)?.[1]?.trim() || "—";
    const baseUrl = Deno.env.get("PUBLIC_APP_URL")
      || "https://id-preview--9ba329fa-bc86-4fa7-8521-f11e9da54abe.lovable.app";
    const leadUrl = `${baseUrl.replace(/\/$/, "")}/leads/${lead.id}`;

    const results: any[] = [];
    for (const r of list) {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "new-lead-alert",
          recipientEmail: r.email,
          idempotencyKey: `new-lead-${lead.id}-${r.user_id}`,
          purpose: "transactional",
          templateData: {
            leadName: lead.nome || "Novo lead",
            leadPhone: lead.telefone || "—",
            leadEmail: lead.email || "—",
            origem: lead.origem || "—",
            fonte: lead.fonte || "—",
            interest,
            leadUrl,
          },
        },
      });
      results.push({ to: r.email, ok: !error, error: error?.message });
    }

    return new Response(JSON.stringify({ ok: true, sent: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-new-lead error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
