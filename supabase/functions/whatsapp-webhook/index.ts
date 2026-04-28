// WhatsApp webhook (Evolution API) — recebe mensagens, transcreve áudio,
// responde com IA (cascata Gemini Pro → Flash → GPT-5-mini), salva no CRM.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-evolution-secret, client-token",
};

const AI_SYSTEM = `IDENTIDADE
Você é a Helena, assistente virtual da HR Imóveis (imobiliária urbana — venda e aluguel de casas, apartamentos, comerciais e terrenos).

OBJETIVO PRINCIPAL (fluxo sequencial, não pule passos):
1) Coletar NOME COMPLETO (nome + sobrenome).
2) Quando tiver o nome completo, chame update_lead_info com o nome.
3) Coletar INTENÇÃO: comprar, alugar, vender ou anunciar imóvel.
4) Quando tiver a intenção clara, chame update_lead_info de novo com nome + intenção.
5) Coletar PREFERÊNCIA DE CONTATO: visita ao imóvel, videochamada ou ligação.
6) Chamar request_broker com a opção escolhida.
7) Encerrar dizendo que um corretor entra em contato em breve.

REGRAS DE LINGUAGEM E TOM
- Simples, cordial, direto — mensagem de WhatsApp do dia a dia.
- UMA pergunta por mensagem. Máximo 2 linhas curtas.
- Sem listas longas, sem numerações. Máximo 1 emoji por mensagem.
- Use "você". Nunca "senhor", "senhora".
- Apresente-se só na primeira mensagem ou se perguntarem.
- Se a mensagem veio de áudio transcrito, responda em texto sem comentar.
- Nunca invente preço, endereço ou disponibilidade de imóvel.

FLUXO DETALHADO
Passo 1 — Apresentação + nome (PRIMEIRA mensagem, EXATAMENTE este texto):
  "Olá! Sou a Helena, assistente da HR Imóveis, prazer falar com você!\\n\\nPara melhor te atender, me diz seu nome completo?"
  Se vier só primeiro nome: "E qual é seu sobrenome?"
  Quando tiver o nome completo → chame update_lead_info.

Passo 2 — Intenção:
  "Legal, [Nome]! Você quer comprar, alugar, vender ou anunciar um imóvel?"
  Se ambíguo: "Desculpa, não entendi. Você quer comprar, alugar, vender ou anunciar?"
  Quando tiver a intenção → chame update_lead_info com nome + intenção.

Passo 3 — Preferência de contato:
  "Perfeito! Como prefere falar com o corretor: visita ao imóvel, videochamada ou ligação?"
  Quando escolher → chame request_broker.

Passo 4 — Encerramento:
  "Ótimo! Um corretor da HR Imóveis vai entrar em contato com você em breve."

LEAD JÁ CADASTRADO (quando o sistema avisar "Lead já cadastrado: SIM"):
- NUNCA pergunte nome ou intenção de novo.
- Saudação + duas opções: "Olá novamente, [Nome]! Quer falar com o corretor agora ou agendar visita/ligação/videochamada?"
- Se pedir AGORA ("urgente", "me liga", "agora") → chame request_broker com kind=agora.
- Se pedir agendamento → pergunte o tipo se ainda não tiver.

PÓS-CONTATO (quando "Corretor já notificado: SIM"):
- NÃO chame request_broker de novo.
- Tranquilize: "Já avisei o corretor, ele vai te chamar em instantes."`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "update_lead_info",
      description: "Salva nome completo e, quando disponível, a intenção do lead.",
      parameters: {
        type: "object",
        properties: {
          full_name: { type: "string", description: "Nome completo da pessoa" },
          interest: {
            type: "string",
            enum: ["comprar", "alugar", "vender", "anunciar", "outro"],
            description: "Opcional. Tipo de interesse imobiliário",
          },
        },
        required: ["full_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_broker",
      description: "Aciona o corretor para falar com o lead. Use 'agora' quando o lead pedir urgência; senão use o tipo de contato preferido.",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["visita", "videochamada", "ligacao", "agora"],
            description: "visita=ver o imóvel pessoalmente; videochamada=vídeo; ligacao=telefone; agora=falar imediatamente",
          },
          topic: { type: "string", description: "Resumo do que o lead quer (1 frase)" },
        },
        required: ["kind"],
      },
    },
  },
];

type ToolCall = { name: string; args: any };

function getEvolutionInstance(): string | null {
  return Deno.env.get("EVOLUTION_INSTANCE") || Deno.env.get("EVOLUTION_INSTANCE_NAME") || null;
}

async function callAI(messages: any[], model: string): Promise<{ text: string; toolCalls: ToolCall[] }> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: AI_SYSTEM }, ...messages],
      tools: TOOLS,
      tool_choice: "auto",
    }),
  });
  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    console.error("AI gateway fail", model, r.status, errText.slice(0, 500));
    throw new Error("AI " + r.status);
  }
  const d = await r.json();
  const msg = d.choices?.[0]?.message;
  const raw = msg?.content;
  const text = typeof raw === "string"
    ? raw.trim()
    : Array.isArray(raw)
      ? raw.map((p: any) => typeof p === "string" ? p : (p?.text || "")).join("").trim()
      : "";
  const toolCalls: ToolCall[] = (msg?.tool_calls ?? []).map((tc: any) => {
    let args: any = {};
    try { args = typeof tc.function?.arguments === "string" ? JSON.parse(tc.function.arguments) : (tc.function?.arguments ?? {}); } catch { args = {}; }
    return { name: tc.function?.name, args };
  });
  return { text, toolCalls };
}

async function fetchEvolutionMediaBase64(messageKey: any): Promise<{ base64: string; mimetype: string } | null> {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const instance = getEvolutionInstance();
  if (!url || !key || !instance) return null;
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/chat/getBase64FromMediaMessage/${instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({ message: { key: messageKey }, convertToMp4: false }),
    });
    if (!r.ok) { console.error("getBase64FromMediaMessage fail", r.status); return null; }
    const d = await r.json();
    const base64 = d.base64 || d.data?.base64 || d.media || null;
    const mimetype = d.mimetype || d.mediaType || "audio/ogg";
    if (!base64) return null;
    return { base64, mimetype };
  } catch (e) { console.error("media fetch error", e); return null; }
}

async function transcribeAudio(base64: string, mimetype: string): Promise<string | null> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você transcreve áudios em português brasileiro. Retorne SOMENTE o texto falado, sem comentários, aspas ou prefixos." },
          { role: "user", content: [
            { type: "text", text: "Transcreva este áudio:" },
            { type: "input_audio", input_audio: { data: base64, format: mimetype.includes("mp3") ? "mp3" : (mimetype.includes("wav") ? "wav" : "ogg") } },
          ] },
        ],
      }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const text = (d.choices?.[0]?.message?.content || "").trim();
    return text || null;
  } catch { return null; }
}

async function sendToProvider(phone: string, content: string): Promise<boolean> {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const instance = getEvolutionInstance();
  if (!url || !key || !instance) {
    console.warn("Evolution não configurado", { hasUrl: !!url, hasKey: !!key, hasInstance: !!instance });
    return false;
  }
  const r = await fetch(`${url.replace(/\/$/, "")}/message/sendText/${instance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ number: phone, text: content }),
  });
  const txt = await r.text();
  if (!r.ok) { console.error("Evolution send fail", r.status, txt.slice(0, 200)); return false; }
  return true;
}

function normalizeBr(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  const noDdi = digits.length > 10 && digits.startsWith("55") ? digits.slice(2) : digits;
  if (noDdi.length === 11 && noDdi[2] === "9") return noDdi.slice(0, 2) + noDdi.slice(3);
  return noDdi.slice(-10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Autenticação opcional via secret compartilhado (header ou query)
    const expectedSecretRaw = Deno.env.get("WHATSAPP_WEBHOOK_SECRET");
    if (expectedSecretRaw) {
      const url = new URL(req.url);
      const provided = (
        req.headers.get("x-webhook-secret") ||
        req.headers.get("x-evolution-secret") ||
        req.headers.get("client-token") ||
        url.searchParams.get("secret") ||
        ""
      ).trim();
      if (provided !== expectedSecretRaw.trim()) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ----- Extrai phone, content, externalId -----
    let phone: string | null = null;
    let content: string | null = null;
    let externalId: string | null = null;
    let pushName: string | null = null;

    if (body?.data?.key) {
      const fromMe = body.data.key.fromMe;
      if (fromMe) {
        return new Response(JSON.stringify({ ok: true, ignored: "fromMe" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      phone = String(body.data.key.remoteJid || "").replace(/@.*$/, "");
      externalId = body.data.key.id;
      pushName = body.data.pushName || null;
      content =
        body.data.message?.conversation ||
        body.data.message?.extendedTextMessage?.text ||
        body.data.message?.imageMessage?.caption ||
        body.data.message?.videoMessage?.caption ||
        null;

      if (!content && (body.data.message?.audioMessage || body.data.message?.pttMessage)) {
        const mimetype = body.data.message?.audioMessage?.mimetype || "audio/ogg";
        let base64: string | null = body.data.message?.base64 || null;
        if (!base64) {
          const media = await fetchEvolutionMediaBase64(body.data.key);
          if (media) base64 = media.base64;
        }
        if (base64) {
          const transcript = await transcribeAudio(base64, mimetype);
          if (transcript) { content = transcript; console.log("audio transcrito", transcript.slice(0, 100)); }
        }
      }
    }

    if (!phone || !content) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tail8 = normalizeBr(phone).slice(-8);
    const ts = new Date().toISOString();

    // ----- Upsert conversation por sufixo canônico -----
    const { data: convs } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .ilike("phone", `%${tail8}%`)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(5);
    let conv: any = (convs ?? []).find((c: any) => normalizeBr(c.phone).endsWith(tail8)) ?? null;

    if (!conv) {
      const { data: newConv } = await supabase
        .from("whatsapp_conversations")
        .insert({
          phone,
          contact_name: pushName,
          ai_enabled: true,
          last_message_at: ts,
          last_message_preview: content,
          unread_count: 1,
        })
        .select("*").single();
      conv = newConv;
    } else {
      await supabase.from("whatsapp_conversations").update({
        last_message_at: ts,
        last_message_preview: content,
        contact_name: pushName ?? conv.contact_name,
        unread_count: (conv.unread_count ?? 0) + 1,
      }).eq("id", conv.id);
    }

    // ----- Tenta vincular lead existente -----
    let leadIdStr: string | null = conv?.lead_id ?? null;
    let leadUuid: string | null = null;
    if (leadIdStr && /^[0-9a-f-]{36}$/i.test(leadIdStr)) leadUuid = leadIdStr;

    if (!leadUuid) {
      const { data: leads } = await supabase
        .from("leads")
        .select("id, telefone")
        .ilike("telefone", `%${tail8}%`)
        .order("created_at", { ascending: false })
        .limit(5);
      const match = (leads ?? []).find((l: any) => normalizeBr(l.telefone || "").endsWith(tail8));
      if (match) {
        leadUuid = match.id;
        await supabase.from("whatsapp_conversations").update({ lead_id: match.id }).eq("id", conv.id);
      }
    }

    // Cria lead novo se ainda não existe
    if (!leadUuid) {
      const { data: newLead } = await supabase.from("leads").insert({
        nome: pushName || `WhatsApp ${phone}`,
        telefone: phone,
        origem: "whatsapp",
        etapa_funil: "Novo Lead",
      }).select("id").single();
      if (newLead) {
        leadUuid = newLead.id;
        await supabase.from("whatsapp_conversations").update({ lead_id: newLead.id }).eq("id", conv.id);
      }
    }

    // Salva mensagem inbound
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conv.id,
      external_id: externalId,
      direction: "inbound",
      author: "lead",
      content,
      status: "delivered",
      timestamp: ts,
    });

    // ----- Se IA desligada, encerra aqui -----
    if (conv.ai_enabled === false) {
      return new Response(JSON.stringify({ ok: true, ai: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ----- Contexto do lead -----
    const { data: leadRow } = leadUuid
      ? await supabase.from("leads").select("nome, qualificacao, observacoes").eq("id", leadUuid).maybeSingle()
      : { data: null as any };
    const hasName = !!leadRow?.nome && !leadRow.nome.startsWith("WhatsApp ");
    const hasInterest = !!leadRow?.qualificacao;
    const firstName = hasName ? leadRow!.nome.split(/\s+/)[0] : "";
    const isKnownLead = hasName && hasInterest;

    // Histórico
    const { data: history } = await supabase
      .from("whatsapp_messages")
      .select("direction, author, content")
      .eq("conversation_id", conv.id)
      .order("created_at")
      .limit(20);
    const aiMessages: any[] = (history ?? []).slice(-8).map(h => ({
      role: h.direction === "outbound" ? "assistant" : "user",
      content: h.content,
    }));

    const alreadyNotified = (history ?? []).some(h =>
      h.direction === "outbound" && /j[áa] avisei o corretor|corretor vai te (chamar|ligar)/i.test(h.content || "")
    );

    aiMessages.unshift({
      role: "system",
      content: `Contexto:
- Estado do lead: nome=${hasName ? leadRow!.nome : "(faltando)"}, interesse=${hasInterest ? leadRow!.qualificacao : "(faltando)"}.
- Lead já cadastrado? ${isKnownLead ? "SIM" : "não"}.
- Corretor já notificado nesta conversa? ${alreadyNotified ? "SIM" : "não"}.`,
    });

    // ----- Cascata de modelos -----
    let result: { text: string; toolCalls: ToolCall[] } = { text: "", toolCalls: [] };
    try {
      for (const model of ["google/gemini-2.5-pro", "google/gemini-2.5-flash", "openai/gpt-5-mini"]) {
        result = await callAI(aiMessages, model);
        if (result.text || result.toolCalls.length > 0) break;
        console.warn("Empty reply, trying next", { model });
      }
    } catch (e) {
      console.error("AI cascade error", e);
    }

    // ----- Processa tool calls -----
    let brokerKind: string | null = null;
    let brokerTopic: string | undefined;
    for (const tc of result.toolCalls) {
      if (tc.name === "update_lead_info" && leadUuid) {
        const fullName = String(tc.args?.full_name || "").trim();
        const interest = ["comprar", "alugar", "vender", "anunciar", "outro"].includes(tc.args?.interest)
          ? tc.args.interest : null;
        const update: any = { ultima_interacao: new Date().toISOString() };
        if (fullName) update.nome = fullName;
        if (interest) update.qualificacao = interest;
        if (Object.keys(update).length > 1) {
          await supabase.from("leads").update(update).eq("id", leadUuid);
        }
      }
      if (tc.name === "request_broker") {
        const k = tc.args?.kind;
        if (["visita", "videochamada", "ligacao", "agora"].includes(k)) {
          brokerKind = k;
          if (tc.args?.topic) brokerTopic = String(tc.args.topic).slice(0, 280);
        }
      }
    }

    // Resposta final (com fallback)
    let reply = result.text?.trim() || "";
    if (!reply) {
      if (!hasName) {
        reply = "Olá! Sou a Helena, assistente da HR Imóveis, prazer falar com você!\n\nPara melhor te atender, me diz seu nome completo?";
      } else if (!hasInterest) {
        reply = `Legal, ${firstName}! Você quer comprar, alugar, vender ou anunciar um imóvel?`;
      } else {
        reply = "Perfeito! Como prefere falar com o corretor: visita ao imóvel, videochamada ou ligação?";
      }
    }

    if (brokerKind) {
      const labels: Record<string, string> = {
        visita: "uma visita ao imóvel",
        videochamada: "uma videochamada",
        ligacao: "uma ligação",
        agora: "contato agora",
      };
      reply += `\n\nJá avisei o corretor sobre sua preferência de ${labels[brokerKind]}. Em breve ele entra em contato!`;

      // Anota no lead
      if (leadUuid) {
        const note = `📞 Lead solicitou: ${labels[brokerKind]}${brokerTopic ? ` — "${brokerTopic}"` : ""}`;
        const { data: cur } = await supabase.from("leads").select("observacoes, etapa_funil").eq("id", leadUuid).maybeSingle();
        await supabase.from("leads").update({
          observacoes: cur?.observacoes ? `${cur.observacoes}\n${note}` : note,
          etapa_funil: cur?.etapa_funil === "Novo Lead" ? "Em Atendimento" : cur?.etapa_funil,
          ultima_interacao: new Date().toISOString(),
        }).eq("id", leadUuid);
      }
    }

    // Envia para o WhatsApp e salva no banco
    if (reply) {
      await supabase.from("whatsapp_messages").insert({
        conversation_id: conv.id,
        direction: "outbound",
        author: "ia",
        content: reply,
        status: "sent",
        timestamp: new Date().toISOString(),
      });
      await sendToProvider(phone, reply);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("whatsapp-webhook error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
