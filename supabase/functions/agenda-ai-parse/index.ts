// Edge function para parsear mensagens do WhatsApp com IA e criar reuniões automaticamente.
// Chamada pelo webhook do WhatsApp quando chega uma mensagem inbound.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um assistente de uma imobiliária (HR Imóveis). Receberá uma mensagem de WhatsApp de um cliente e o histórico recente da conversa. Sua tarefa: identificar se o cliente está PEDINDO/CONFIRMANDO um agendamento (ligação, reunião presencial ou videochamada).

Regras:
- Só agende se houver CLAREZA na intenção e em data/hora. Se faltar informação, NÃO agende.
- Tipo deve ser exatamente: "ligacao", "presencial" ou "videochamada".
- Se a pessoa só fez uma pergunta, ou pediu informação, NÃO agende.
- O fuso horário é America/Sao_Paulo. Hoje é fornecido no contexto do usuário.
- Retorne sempre via tool call.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { conversation_id, message_id, content, phone, contact_name, lead_id } = await req.json();
    if (!content) {
      return new Response(JSON.stringify({ ok: true, ignored: "no content" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Histórico recente (últimas 8 mensagens)
    let history: any[] = [];
    if (conversation_id) {
      const { data } = await supabase
        .from("whatsapp_messages")
        .select("direction, content, timestamp")
        .eq("conversation_id", conversation_id)
        .order("timestamp", { ascending: false })
        .limit(8);
      history = (data ?? []).reverse();
    }

    const nowISO = new Date().toISOString();
    const historyText = history
      .map((m) => `[${m.direction === "inbound" ? "Cliente" : "Corretor"}] ${m.content}`)
      .join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Data/hora atual (UTC): ${nowISO}
Contato: ${contact_name || phone}
Telefone: ${phone}

Histórico recente:
${historyText}

Última mensagem do cliente:
"${content}"

Decida se há um agendamento claro. Use a tool agendar_reuniao se sim, ou ignorar_mensagem se não.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "agendar_reuniao",
              description: "Cria um agendamento quando o cliente pediu de forma clara",
              parameters: {
                type: "object",
                properties: {
                  tipo: { type: "string", enum: ["ligacao", "presencial", "videochamada"] },
                  data_hora_iso: {
                    type: "string",
                    description: "Data/hora ISO 8601 com fuso (-03:00) do agendamento",
                  },
                  duracao_min: { type: "integer", default: 60 },
                  titulo: { type: "string" },
                  local_ou_link: { type: "string", description: "Endereço presencial ou link de vídeo, opcional" },
                  notas: { type: "string" },
                },
                required: ["tipo", "data_hora_iso", "titulo"],
                additionalProperties: false,
              },
            },
          },
          {
            type: "function",
            function: {
              name: "ignorar_mensagem",
              description: "Use quando não houver intenção/clareza de agendamento",
              parameters: {
                type: "object",
                properties: { motivo: { type: "string" } },
                required: ["motivo"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: "required",
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      return new Response(JSON.stringify({ ok: false, ai_error: aiRes.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ ok: true, action: "no_tool" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fname = toolCall.function?.name;
    const args = JSON.parse(toolCall.function?.arguments || "{}");

    if (fname !== "agendar_reuniao") {
      return new Response(JSON.stringify({ ok: true, action: "ignored", reason: args?.motivo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const agendada_para = new Date(args.data_hora_iso).toISOString();

    // Verificar conflito com bloqueios
    const { data: bloqueios } = await supabase
      .from("agenda_bloqueios")
      .select("id, motivo")
      .lte("inicio", agendada_para)
      .gte("fim", agendada_para);

    if (bloqueios && bloqueios.length > 0) {
      await supabase.from("agenda_ia_log").insert({
        conversation_id, message_id, raw_text: content, parsed: args,
        status: "blocked",
      });
      return new Response(JSON.stringify({ ok: true, action: "blocked" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Criar reunião
    const { data: reuniao, error: rerr } = await supabase
      .from("reunioes")
      .insert({
        agendada_para,
        tipo: args.tipo,
        duracao_min: args.duracao_min || 60,
        titulo: args.titulo,
        local: args.tipo === "presencial" ? args.local_ou_link : null,
        link: args.tipo === "videochamada" ? args.local_ou_link : null,
        notas: args.notas || null,
        status: "agendada",
        criado_por_ia: true,
      })
      .select("id")
      .single();

    if (rerr) {
      console.error("erro reunião:", rerr);
      return new Response(JSON.stringify({ ok: false, error: rerr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("agenda_ia_log").insert({
      reuniao_id: reuniao.id,
      conversation_id,
      message_id,
      raw_text: content,
      parsed: args,
      status: "created",
    });

    // Enviar confirmação ao cliente via WhatsApp
    try {
      const dt = new Date(agendada_para);
      const dataBr = dt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" });
      const tipoLabel = args.tipo === "ligacao" ? "ligação" : args.tipo === "presencial" ? "reunião presencial" : "videochamada";
      const msg = `Olá! Agendei sua ${tipoLabel} para ${dataBr}. ${args.local_ou_link ? `Local/Link: ${args.local_ou_link}. ` : ""}Em caso de imprevisto, é só me avisar por aqui. — HR Imóveis`;
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        body: JSON.stringify({ phone, message: msg, conversation_id }),
      });
    } catch (e) {
      console.error("falha confirmação WhatsApp:", e);
    }

    return new Response(JSON.stringify({ ok: true, action: "created", reuniao_id: reuniao.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("agenda-ai-parse error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
