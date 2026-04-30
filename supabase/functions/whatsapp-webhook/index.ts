// WhatsApp webhook (Evolution API) — Sofia, consultora HR Imóveis (alto padrão Sinop-MT).
// Recebe mensagens, transcreve áudio, responde com IA (cascata Gemini Pro → Flash → GPT-5-mini),
// consulta portfólio real e salva no CRM.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-evolution-secret, client-token",
};

function maskSecret(value: string): string {
  return value ? `${value.slice(0, 3)}…(${value.length})` : "(empty)";
}

function extractSecretCandidates(raw: string): Set<string> {
  const candidates = new Set<string>();
  const expected = raw.trim();
  if (!expected) return candidates;
  candidates.add(expected);

  try {
    const expectedUrl = new URL(expected);
    const secretFromUrl = expectedUrl.searchParams.get("secret")?.trim();
    if (secretFromUrl) candidates.add(secretFromUrl);
  } catch {
    const secretFromText = expected.match(/[?&]secret=([^&\s]+)/)?.[1];
    if (secretFromText) candidates.add(decodeURIComponent(secretFromText).trim());
  }

  return candidates;
}

function getProvidedWebhookSecret(req: Request): string {
  const url = new URL(req.url);
  return (
    req.headers.get("x-webhook-secret") ||
    req.headers.get("x-evolution-secret") ||
    req.headers.get("client-token") ||
    req.headers.get("apikey") ||
    url.searchParams.get("secret") ||
    ""
  ).trim();
}

const AI_SYSTEM = `IDENTIDADE
Você é a Sofia, assistente de atendimento da HR Imóveis no WhatsApp. A HR Imóveis trabalha com compra, venda e aluguel de imóveis em Sinop-MT, do padrão ao alto padrão, junto com o corretor Hans Rodovalho.

OBJETIVO PRINCIPAL (fluxo sequencial, não pule passos):
1. Coletar NOME COMPLETO (nome e sobrenome).
2. Assim que tiver o nome completo, chame update_lead_info com o nome.
3. Coletar INTENÇÃO: compra, venda, aluguel ou investidor.
4. Chamar update_lead_info de novo com nome + intenção.
5. Coletar PREFERÊNCIA DE CONTATO: videochamada, reunião presencial, ligação ou WhatsApp.
6. Coletar URGÊNCIA: lead quer falar AGORA com o Hans ou prefere AGENDAR um horário?
7a. Se AGENDAR → chame send_booking_link com a opção escolhida.
7b. Se AGORA → chame request_immediate_contact com a opção escolhida.
8. Encerrar conforme o caminho.

REGRAS DE LINGUAGEM E TOM
- Simples, informal, direto — como mensagem de WhatsApp do dia a dia.
- Público: comprador/vendedor de imóvel. Zero jargão, zero inglês, zero formalismo.
- UMA pergunta por mensagem. Máximo 2 linhas curtas por mensagem.
- Sem listas, sem numerações. Não use emojis em hipótese alguma.
- Não use gírias nem expressões informais como "show", "top", "massa", "beleza", "bora", "tranquilo", "suave". Use linguagem simples, clara e cordial.
- NUNCA escreva nomes de função (send_booking_link, request_immediate_contact, update_lead_info), parâmetros técnicos (kind=, uuid=, token=, lead_id=) nem URLs/links na sua resposta. Para enviar o link de agendamento, use SEMPRE a tool send_booking_link — o sistema gera e anexa o link automaticamente. Sua mensagem deve conter APENAS texto natural em português.
- Linguagem neutra: use "você" sempre. Nunca "senhor", "senhora", "moço", "moça".
- Apresente-se só na primeira mensagem ou se perguntarem.
- Se a mensagem veio de áudio transcrito, responda normal em texto.
- Nunca invente informação. Se a intenção for ambígua, peça clarificação.

FLUXO DETALHADO

Passo 1 — Apresentação + nome (OBRIGATÓRIO: enviar EXATAMENTE este texto na primeira mensagem):
"Olá! Sou a Sofia, assistente da HR Imóveis, prazer falar com você!

Para melhor te atender, me diz seu nome completo?"

Se vier só primeiro nome: "E qual é seu sobrenome?"
Quando tiver o nome completo → chame update_lead_info com full_name.

Passo 2 — Intenção:
"Legal, [Nome]! Você quer comprar um imóvel, vender, alugar ou é investidor?"
Quando tiver a intenção clara → chame update_lead_info com full_name + interest.

Passo 3 — Forma de contato:
"Perfeito! Como você prefere falar com o Hans: videochamada, reunião presencial, ligação ou WhatsApp?"
Se não escolher de primeira: "Qual fica melhor pra você: videochamada, presencial, ligação ou WhatsApp?"

Passo 4 — Urgência:
"E você prefere falar com ele agora mesmo ou agendar um horário?"

Passo 5a — AGENDAR: chame send_booking_link com kind correspondente. NÃO inclua URL na sua mensagem — o sistema adiciona o link. Exemplo: "Perfeito! Te envio o link para você escolher o melhor dia e horário."

Passo 5b — AGORA: chame request_immediate_contact com kind correspondente. Responda algo como: "Pronto! Já avisei o Hans, ele vai te chamar agora mesmo." NÃO mande link de agendamento.

Passo 6 — Encerramento:
Se a conversa retomar depois (ex.: "ok", "obrigado"), apenas se despeça. NUNCA chame send_booking_link nem request_immediate_contact de novo.

URGÊNCIA DETECTADA CEDO (REGRA CRÍTICA — NUNCA IGNORE)
Se a qualquer momento o lead expressar urgência — palavras/frases como "agora", "agora mesmo", "urgente", "quero falar já", "pode me ligar agora", "queria falar com ele agora", "rápido", "hoje" — você DEVE:
1. NÃO repetir a pergunta anterior. NÃO ignorar o sinal.
2. Se a forma de contato (videochamada/presencial/ligação/WhatsApp) JÁ foi mencionada na mesma frase ou em mensagem anterior → chame request_immediate_contact direto com aquele kind. Não pergunte de novo.
3. Se a forma de contato AINDA não foi escolhida → responda UMA única vez: "Certo, já vou avisar o Hans. Para ele te chamar, você prefere por videochamada, ligação, presencial ou WhatsApp?" Quando o lead responder a forma, chame request_immediate_contact imediatamente.
4. Se o lead responder com algo ambíguo ou disser "tanto faz", "qualquer um", "do jeito que for mais rápido" → chame request_immediate_contact com kind="whatsapp" (mais rápido) e siga.

ANTI-LOOP (REGRA CRÍTICA)
- NUNCA repita a mesma pergunta 3 vezes. Se já perguntou 2 vezes a forma de contato e o lead não escolheu claramente:
  - Se ele demonstrou urgência → assuma kind="whatsapp" e chame request_immediate_contact.
  - Se não demonstrou urgência → assuma kind="whatsapp", urgência="agendar" e chame send_booking_link com whatsapp.
- Se a mensagem do lead contém "agora" e você já entendeu a forma → AÇÃO, não pergunta.

CASOS ESPECIAIS
- Pessoa repete info que já deu: não corrija, siga adiante.
- Pessoa desvia do assunto: traga de volta gentilmente para o passo atual.
- Pessoa diz "não sei ainda": "Sem pressa! Quando decidir é só chamar." Encerre.
- Pessoa pergunta sobre preço, localização, detalhes: "Ótima dúvida! O Hans esclarece tudo quando vocês conversarem." Siga o fluxo.

IMPORTANTE: Chame update_lead_info assim que tiver cada dado. Só chame send_booking_link OU request_immediate_contact (uma das duas, nunca as duas) depois de saber a forma de contato E a urgência — exceto no caso de urgência detectada cedo, onde você pode pular pra request_immediate_contact assim que tiver a forma.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "update_lead_info",
      description: "Salva nome completo e/ou intenção do lead.",
      parameters: {
        type: "object",
        properties: {
          full_name: { type: "string", description: "Nome completo (nome + sobrenome)" },
          interest: {
            type: "string",
            enum: ["compra", "venda", "aluguel", "investidor"],
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_booking_link",
      description: "Envia link de agendamento com o Hans no formato escolhido. Use SOMENTE quando o lead quer AGENDAR um horário (não agora).",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["videochamada", "presencial", "ligacao", "whatsapp"],
          },
        },
        required: ["kind"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_immediate_contact",
      description: "Marca o lead como contato imediato e dispara notificação por email para o Hans. Use SOMENTE quando o lead quer falar AGORA.",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["videochamada", "presencial", "ligacao", "whatsapp"],
          },
        },
        required: ["kind"],
      },
    },
  },
];

type ToolCall = { name: string; args: any; id?: string };

// Remove vazamentos de tool-call/parametros técnicos que o LLM às vezes coloca como texto
function sanitizeReply(s: string): string {
  if (!s) return "";
  return s
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/\S*\b(?:kind|uuid|token|lead_id|conversation_id|reuniao_id)\s*=\s*\S+/gi, "")
    .replace(/\b(send_booking_link|request_immediate_contact|update_lead_info)\s*\([^)]*\)/gi, "")
    .replace(/\b(send_booking_link|request_immediate_contact|update_lead_info)\b/gi, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/(^|\s)[A-Za-z0-9_-]{8,}\?(\s|$)/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Detecta se o LLM "vazou" um intent de booking/imediato como texto
function detectLeakedIntent(s: string): { kind: string | null; isImmediate: boolean } {
  if (!s) return { kind: null, isImmediate: false };
  const m = s.match(/kind\s*=\s*["']?(videochamada|presencial|ligacao|whatsapp)/i);
  const kind = m?.[1]?.toLowerCase() ?? null;
  const isImmediate = /request_immediate_contact|contato.{0,10}imediato/i.test(s);
  return { kind, isImmediate };
}

function getEvolutionInstance(): string | null {
  return Deno.env.get("EVOLUTION_INSTANCE") || Deno.env.get("EVOLUTION_INSTANCE_NAME") || null;
}

async function callAI(messages: any[], model: string): Promise<{ text: string; toolCalls: ToolCall[]; raw?: any }> {
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
    return { name: tc.function?.name, args, id: tc.id };
  });
  return { text, toolCalls, raw: msg };
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

function normalizeEvolutionBaseUrl(value: string): string {
  try { return new URL(value).origin; } catch { return value.replace(/\/$/, ""); }
}

async function sendToProvider(phone: string, content: string): Promise<boolean> {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  const instance = getEvolutionInstance();
  if (!url || !key || !instance) {
    console.warn("Evolution não configurado", { hasUrl: !!url, hasKey: !!key, hasInstance: !!instance });
    return false;
  }
  const baseUrl = normalizeEvolutionBaseUrl(url);
  const r = await fetch(`${baseUrl}/message/sendText/${instance}`, {
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

function formatBRL(v: number | null | undefined): string {
  if (v == null) return "-";
  try { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }); }
  catch { return `R$ ${v}`; }
}

async function consultarImoveis(supabase: any, args: any): Promise<any[]> {
  const lim = Math.max(1, Math.min(10, Number(args?.limit) || 5));
  let q = supabase.from("imoveis")
    .select("id, titulo, tipo, finalidade, status, valor, bairro, cidade, quartos, suites, vagas, area_total, area_util, descricao")
    .eq("status", "Disponível")
    .limit(lim);

  if (args?.bairro) q = q.ilike("bairro", `%${String(args.bairro)}%`);
  if (args?.tipo) q = q.ilike("tipo", `%${String(args.tipo)}%`);
  if (args?.finalidade) q = q.eq("finalidade", String(args.finalidade));
  if (typeof args?.quartos_min === "number") q = q.gte("quartos", args.quartos_min);
  if (typeof args?.suites_min === "number") q = q.gte("suites", args.suites_min);
  if (typeof args?.preco_min === "number") q = q.gte("valor", args.preco_min);
  if (typeof args?.preco_max === "number") q = q.lte("valor", args.preco_max);
  if (typeof args?.area_min === "number") q = q.gte("area_total", args.area_min);
  if (args?.query) q = q.or(`titulo.ilike.%${args.query}%,descricao.ilike.%${args.query}%`);

  const { data, error } = await q;
  if (error) { console.error("consultar_imoveis error", error); return []; }
  return (data || []).map((i: any) => ({
    titulo: i.titulo,
    tipo: i.tipo,
    finalidade: i.finalidade,
    bairro: i.bairro,
    cidade: i.cidade,
    valor: formatBRL(i.valor),
    quartos: i.quartos,
    suites: i.suites,
    vagas: i.vagas,
    area_total_m2: i.area_total,
    area_util_m2: i.area_util,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const expectedSecretRaw = Deno.env.get("WHATSAPP_WEBHOOK_SECRET");
    if (expectedSecretRaw) {
      const provided = getProvidedWebhookSecret(req);
      const expectedCandidates = extractSecretCandidates(expectedSecretRaw);

      if (!expectedCandidates.has(provided)) {
        if ((req.method === "GET" || req.method === "HEAD") && !provided) {
          return new Response(JSON.stringify({ ok: true, healthcheck: true, webhook: "whatsapp-webhook" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.warn(
          `[whatsapp-webhook] invalid_secret. provided=${maskSecret(provided)} expected_prefix=${maskSecret(expectedSecretRaw.trim())} candidates=${expectedCandidates.size} method=${req.method} url=${req.url}`
        );
        return new Response(
          JSON.stringify({
            error: "invalid_secret",
            hint: "Configure o webhook da Evolution/Z-API com ?secret=SEU_TOKEN ou envie o mesmo token no header apikey/x-webhook-secret.",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

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

    const { error: inboundErr } = await supabase.from("whatsapp_messages").insert({
      conversation_id: conv.id,
      external_id: externalId,
      direction: "inbound",
      author: "humano",
      content,
      status: "delivered",
      timestamp: ts,
    });
    if (inboundErr) console.error("inbound insert failed", inboundErr);

    // Auto-move lead de "Novo Lead" para "Em Contato" assim que ele responde
    if (leadUuid) {
      const { data: leadStage } = await supabase.from("leads").select("etapa_funil").eq("id", leadUuid).maybeSingle();
      if (leadStage?.etapa_funil === "Novo Lead") {
        await supabase.from("leads").update({
          etapa_funil: "Em Contato",
          ultima_interacao: ts,
        }).eq("id", leadUuid);
      }
    }

    if (conv.ai_enabled === false) {
      return new Response(JSON.stringify({ ok: true, ai: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: leadRow } = leadUuid
      ? await supabase.from("leads").select("nome, telefone, tags, observacoes").eq("id", leadUuid).maybeSingle()
      : { data: null as any };
    const hasName = !!leadRow?.nome && !leadRow.nome.startsWith("WhatsApp ");
    const leadPhoneRaw = (leadRow?.telefone || "").replace(/\D/g, "");
    const hasPhone = leadPhoneRaw.length >= 10;
    const firstName = hasName ? leadRow!.nome.split(/\s+/)[0] : "";
    const isUrgent = Array.isArray(leadRow?.tags) && leadRow!.tags.includes("urgente");

    const { data: history } = await supabase
      .from("whatsapp_messages")
      .select("direction, author, content")
      .eq("conversation_id", conv.id)
      .order("created_at")
      .limit(20);
    const aiMessages: any[] = (history ?? []).slice(-10).map(h => ({
      role: h.direction === "outbound" ? "assistant" : "user",
      content: h.content,
    }));

    const alreadyNotified = (history ?? []).some(h =>
      h.direction === "outbound" && /hans (vai|entra) (te )?(chamar|ligar|entrar em contato)/i.test(h.content || "")
    );

    aiMessages.unshift({
      role: "system",
      content: `Contexto do lead:
- Nome: ${hasName ? leadRow!.nome : "(faltando — pedir)"}
- Telefone (já temos do WhatsApp): ${phone}
- Intenção registrada: ${(leadRow as any)?.observacoes && /Intenção:/i.test((leadRow as any).observacoes) ? "sim" : "(faltando — perguntar)"}
- Hans já notificado nesta conversa? ${alreadyNotified ? "SIM" : "não"}`,
    });

    // Cascata + loop de tool calls
    let result: { text: string; toolCalls: ToolCall[]; raw?: any } = { text: "", toolCalls: [] };
    let bookingKind: string | null = null;
    let immediateKind: string | null = null;

    const MODELS = ["google/gemini-2.5-pro", "google/gemini-2.5-flash", "openai/gpt-5-mini"];
    let workingMessages = [...aiMessages];

    for (let round = 0; round < 2; round++) {
      result = { text: "", toolCalls: [] };
      try {
        for (const model of MODELS) {
          result = await callAI(workingMessages, model);
          if (result.text || result.toolCalls.length > 0) break;
          console.warn("Empty reply, trying next", { model });
        }
      } catch (e) { console.error("AI cascade error", e); }

      if (result.toolCalls.length === 0) break;

      const toolCallsForApi = result.toolCalls.map(tc => ({
        id: tc.id || `call_${Math.random().toString(36).slice(2)}`,
        type: "function",
        function: { name: tc.name, arguments: JSON.stringify(tc.args ?? {}) },
      }));
      workingMessages.push({ role: "assistant", content: result.text || "", tool_calls: toolCallsForApi });

      let needAnotherRound = false;
      for (let i = 0; i < result.toolCalls.length; i++) {
        const tc = result.toolCalls[i];
        const callId = toolCallsForApi[i].id;
        let toolResult: any = { ok: true };

        if (tc.name === "update_lead_info" && leadUuid) {
          const fullName = String(tc.args?.full_name || "").trim();
          const interest = tc.args?.interest as string | undefined;
          const update: any = { ultima_interacao: new Date().toISOString() };
          if (fullName) update.nome = fullName;
          if (interest && ["compra", "venda", "aluguel", "investidor"].includes(interest)) {
            const { data: cur } = await supabase.from("leads").select("observacoes").eq("id", leadUuid).maybeSingle();
            const note = `Intenção: ${interest}`;
            update.observacoes = cur?.observacoes
              ? (/Intenção:/i.test(cur.observacoes) ? cur.observacoes.replace(/Intenção:.*/i, note) : `${cur.observacoes}\n${note}`)
              : note;
            update.etapa_funil = "Em Contato";
          }
          if (Object.keys(update).length > 1) {
            // Garante etapa válida do kanban quando movemos para "Em Contato"
            if (update.etapa_funil === "Em Atendimento") update.etapa_funil = "Em Contato";
            await supabase.from("leads").update(update).eq("id", leadUuid);
          }
          toolResult = { ok: true, saved: Object.keys(update).filter(k => k !== "ultima_interacao") };
          needAnotherRound = true;
        } else if (tc.name === "send_booking_link") {
          const k = tc.args?.kind;
          if (["videochamada", "presencial", "ligacao", "whatsapp"].includes(k)) {
            bookingKind = k;
          }
          toolResult = { ok: true, scheduled: bookingKind, link_will_be_appended: true };
          needAnotherRound = true;
        } else if (tc.name === "request_immediate_contact") {
          const k = tc.args?.kind;
          if (["videochamada", "presencial", "ligacao", "whatsapp"].includes(k)) {
            immediateKind = k;
          } else {
            // Fallback defensivo: se LLM chamou sem kind ou inválido, default WhatsApp
            immediateKind = "whatsapp";
            console.warn(`[whatsapp-webhook] request_immediate_contact sem kind válido (${k}), usando whatsapp`);
          }
          toolResult = { ok: true, immediate: immediateKind, broker_will_be_notified: true };
          needAnotherRound = true;
        } else {
          toolResult = { error: "unknown tool" };
        }

        workingMessages.push({
          role: "tool",
          tool_call_id: callId,
          content: JSON.stringify(toolResult),
        });
      }

      if (!needAnotherRound) break;
    }

    let reply = result.text?.trim() || "";
    if (!reply) {
      if (!hasName) {
        reply = "Olá! Sou a Sofia, assistente da HR Imóveis, prazer falar com você!\n\nPara melhor te atender, me diz seu nome completo?";
      } else {
        reply = `Legal, ${firstName}! Você quer comprar um imóvel, vender, alugar ou é investidor?`;
      }
    }

    const KIND_LABELS: Record<string, string> = {
      videochamada: "uma videochamada",
      presencial: "uma reunião presencial",
      ligacao: "uma ligação",
      whatsapp: "um contato pelo WhatsApp",
    };

    if (immediateKind) {
      // Marca lead como contato imediato + dispara email
      const note = `🔥 Contato imediato solicitado: ${KIND_LABELS[immediateKind]} — ${new Date().toLocaleString("pt-BR")}`;
      if (leadUuid) {
        const { data: cur } = await supabase.from("leads").select("observacoes, tags").eq("id", leadUuid).maybeSingle();
        const newTags = Array.from(new Set([...(cur?.tags ?? []), "urgente"]));
        await supabase.from("leads").update({
          observacoes: cur?.observacoes ? `${cur.observacoes}\n${note}` : note,
          tags: newTags,
          etapa_funil: "Conversa Ativa",
          ultima_interacao: new Date().toISOString(),
        }).eq("id", leadUuid);

        // Dispara notificação por email (não bloqueia resposta)
        try {
          const { error: notifyErr } = await supabase.functions.invoke("notify-immediate-contact", {
            body: { lead_id: leadUuid, contact_kind: immediateKind },
          });
          if (notifyErr) console.error("notify-immediate-contact returned error", notifyErr);
        } catch (e) {
          console.error("notify-immediate-contact invoke failed", e);
        }
      }

      // Limpa URLs inventadas
      reply = reply.replace(/https?:\/\/\S+/g, "").trim();
      if (!reply) {
        reply = `Show! Já avisei o Hans, ele vai te chamar agora mesmo via ${KIND_LABELS[immediateKind]} 🚀`;
      }
    } else if (bookingKind) {
      // Gera token único e cria o link de agendamento
      const token = (() => {
        const arr = new Uint8Array(24);
        crypto.getRandomValues(arr);
        return btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      })();

      await supabase.from("booking_links").insert({
        token,
        lead_id: leadUuid,
        conversation_id: conv.id,
        phone,
        nome: hasName ? leadRow!.nome : (pushName || null),
        kind: bookingKind,
      });

      const baseUrl = Deno.env.get("PUBLIC_APP_URL") || "https://www.hrimoveis.com";
      const link = `${baseUrl.replace(/\/$/, "")}/agendar/${token}`;

      reply = reply.replace(/https?:\/\/\S+/g, "").trim();
      reply = reply.replace(/em breve\.?$/i, "").trim();

      if (!reply) {
        reply = `Perfeito! Te mando aqui o link pra você escolher o melhor dia e horário pra ${KIND_LABELS[bookingKind]} com o Hans 👇`;
      }
      reply += `\n\n${link}`;

      if (leadUuid) {
        const note = `📞 Lead solicitou: ${KIND_LABELS[bookingKind]} — link enviado`;
        const { data: cur } = await supabase.from("leads").select("observacoes, etapa_funil").eq("id", leadUuid).maybeSingle();
        await supabase.from("leads").update({
          observacoes: cur?.observacoes ? `${cur.observacoes}\n${note}` : note,
          etapa_funil: cur?.etapa_funil === "Novo Lead" ? "Conversa Ativa" : cur?.etapa_funil,
          ultima_interacao: new Date().toISOString(),
        }).eq("id", leadUuid);
      }
    }

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
