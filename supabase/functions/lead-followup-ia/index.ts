import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const normalizeEvolutionBaseUrl = (value: string) => {
  const withProtocol = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
  return new URL(withProtocol).origin;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userRes } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userRes?.user) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { lead_id } = await req.json().catch(() => ({}));
    if (!lead_id) return new Response(JSON.stringify({ error: "lead_id obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: lead } = await supabase.from("leads").select("*").eq("id", lead_id).single();
    if (!lead) return new Response(JSON.stringify({ error: "Lead não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!lead.telefone) return new Response(JSON.stringify({ error: "Lead sem telefone" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Gera mensagem com IA
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const firstName = (lead.nome ?? "").split(" ")[0] || "tudo bem";
    const interesse = lead.imovel_interesse ? ` sobre ${lead.imovel_interesse}` : "";
    const regiao = lead.regiao ? ` em ${lead.regiao}` : "";

    let messageText = `Olá ${firstName}! Tudo bem? Aqui é da HR Imóveis 👋\n\nNotamos que conversamos há alguns dias${interesse}${regiao} e queremos saber se você ainda tem interesse ou precisa de mais informações.\n\nPosso te encaminhar para um corretor especialista para te atender com prioridade?`;

    if (LOVABLE_API_KEY) {
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "Você é um SDR cordial da imobiliária HR Imóveis. Escreva mensagens curtas (máx 4 linhas) em português brasileiro, tom acolhedor, sem emojis em excesso. Use 1 emoji no máximo. Sempre pergunte se o lead precisa de mais informações e ofereça encaminhar para um corretor especialista." },
              { role: "user", content: `Gere uma mensagem de follow-up no WhatsApp para reaquecer este lead que está há 72h+ sem interação.\n\nNome: ${lead.nome}\nInteresse: ${lead.imovel_interesse || "—"}\nRegião: ${lead.regiao || "—"}\nÚltima etapa: ${lead.etapa_funil}\n\nResponda apenas com o texto da mensagem, sem aspas.` },
            ],
          }),
        });
        if (aiRes.ok) {
          const ai = await aiRes.json();
          const txt = ai?.choices?.[0]?.message?.content?.trim();
          if (txt) messageText = txt;
        }
      } catch (e) {
        console.error("AI gen failed", e);
      }
    }

    // Envia via Evolution
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE") || Deno.env.get("EVOLUTION_INSTANCE_NAME");

    let cleanPhone = String(lead.telefone).replace(/\D/g, "");
    if (cleanPhone.length <= 11 && !cleanPhone.startsWith("55")) cleanPhone = "55" + cleanPhone;

    let sendOk = false;
    let sendError: string | null = null;
    let evoData: any = null;

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      sendError = "Evolution API não configurada";
    } else {
      try {
        const baseUrl = normalizeEvolutionBaseUrl(EVOLUTION_API_URL);
        const evoRes = await fetch(`${baseUrl}/message/sendText/${EVOLUTION_INSTANCE_NAME}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
          body: JSON.stringify({ number: cleanPhone, text: messageText }),
        });
        evoData = await evoRes.json().catch(() => ({}));
        if (!evoRes.ok) sendError = `Evolution: ${evoRes.status}`;
        else sendOk = true;
      } catch (e) {
        sendError = e instanceof Error ? e.message : "Erro Evolution";
      }
    }

    // Registra interação
    await supabase.from("interacoes").insert({
      lead_id: lead.id,
      tipo: "whatsapp_ia",
      descricao: messageText,
      resultado: sendOk ? "enviado" : `falha: ${sendError}`,
      created_by: userRes.user.id,
    });

    // Atualiza última interação
    await supabase.from("leads").update({ ultima_interacao: new Date().toISOString() }).eq("id", lead.id);

    return new Response(JSON.stringify({ ok: sendOk, message: messageText, error: sendError }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error("lead-followup-ia error:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
