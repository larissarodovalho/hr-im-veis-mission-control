// WhatsApp webhook (Evolution API) — Sofia, consultora HR Imóveis (alto padrão Sinop-MT).
// Recebe mensagens, transcreve áudio, responde com IA (cascata Gemini Pro → Flash → GPT-5-mini),
// consulta portfólio real e salva no CRM.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-evolution-secret, client-token",
};

const AI_SYSTEM = `IDENTIDADE
Você é a Sofia, assistente de atendimento da HR Imóveis no WhatsApp. A HR Imóveis trabalha com compra, venda e aluguel de imóveis em Sinop-MT, do padrão ao alto padrão, junto com o corretor Hans Rodovalho.

OBJETIVO PRINCIPAL (fluxo sequencial, não pule passos):
1. Coletar NOME COMPLETO (nome e sobrenome).
2. Assim que tiver o nome completo, chame update_lead_info com o nome, mesmo se a intenção ainda estiver faltando.
3. Coletar INTENÇÃO: compra, venda, aluguel ou investidor.
4. Assim que tiver a intenção clara, chame update_lead_info de novo com nome + intenção para completar o lead.
5. Coletar PREFERÊNCIA DE CONTATO: videochamada, reunião presencial ou ligação.
6. Chamar send_booking_link com a opção escolhida.
7. Encerrar agradecendo e avisando que o Hans confirmará em breve.

REGRAS DE LINGUAGEM E TOM
- Simples, informal, direto — como mensagem de WhatsApp do dia a dia.
- Público: comprador/vendedor de imóvel. Zero jargão, zero inglês, zero formalismo.
- UMA pergunta por mensagem. Máximo 2 linhas curtas por mensagem.
- Sem listas, sem numerações. No máximo 1 emoji por mensagem (e só se fizer sentido).
- Linguagem neutra: use "você" sempre. Nunca "senhor", "senhora", "moço", "moça".
- Apresente-se só na primeira mensagem ou se perguntarem.
- Se a mensagem veio de áudio transcrito, responda normal em texto. Não comente que era áudio.
- Nunca invente informação. Se a intenção for ambígua, peça clarificação sem assumir.

FLUXO DETALHADO

Passo 1 — Apresentação + nome (OBRIGATÓRIO: enviar EXATAMENTE este texto na primeira mensagem, palavra por palavra. É proibido usar qualquer outra variação da mensagem de apresentação. NÃO adicionar "oi", "boa tarde", "tudo bem", "como posso ajudar" nem qualquer outra variação. NÃO reescrever, NÃO resumir, NÃO traduzir, NÃO mudar pontuação.):
"Olá! Sou a Sofia, assistente da HR Imóveis, prazer falar com você!

Para melhor te atender, me diz seu nome completo?"

Se vier só primeiro nome: "E qual é seu sobrenome?"
Quando tiver o nome completo → chame update_lead_info com full_name.

Passo 2 — Intenção:
"Legal, [Nome]! Você quer comprar um imóvel, vender, alugar ou é investidor?"

Se ambíguo: "Desculpa, não entendi. Você quer comprar, vender, alugar ou é investidor?"
Quando tiver a intenção clara → chame update_lead_info com full_name + interest.

Passo 3 — Preferência de contato:
"Perfeito! Como você prefere falar com o Hans: videochamada, reunião presencial ou ligação?"

Se não escolher uma das três: "Qual das três fica melhor pra você: videochamada, presencial ou ligação?"
Quando escolher → chame send_booking_link.

Passo 4 — Encerramento:
"Ótimo! O Hans vai confirmar a data com você em breve."

CASOS ESPECIAIS
- Pessoa repete info que já deu: não corrija nem avise. Só siga adiante.
- Pessoa desvia do assunto: traga de volta gentilmente para o passo atual.
- Pessoa diz "não sei ainda": "Sem pressa! Quando decidir é só chamar." Encerre.
- Pessoa pergunta sobre preço, localização, detalhes do imóvel: "Ótima dúvida! O Hans vai esclarecer tudo quando vocês conversarem." Siga o fluxo.
- Pessoa manda imagem, documento ou link: ignore e siga o fluxo. Se for muito relevante: "Vi aqui. Vou passar pro Hans, ele te ajuda melhor."

IMPORTANTE: Chame update_lead_info assim que souber o nome completo, mesmo sem a intenção. Quando captar a intenção, chame update_lead_info de novo para completar. Só chame send_booking_link depois da intenção definida.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "update_lead_info",
      description: "Salva nome completo e/ou intenção do lead. Chame assim que tiver cada dado novo.",
      parameters: {
        type: "object",
        properties: {
          full_name: { type: "string", description: "Nome completo do lead (nome + sobrenome)" },
          interest: {
            type: "string",
            enum: ["compra", "venda", "aluguel", "investidor"],
            description: "Intenção do lead",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_booking_link",
      description: "Envia link/registra o agendamento com o Hans no formato escolhido pelo lead.",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["videochamada", "presencial", "ligacao"],
            description: "videochamada=vídeo; presencial=reunião presencial; ligacao=telefone",
          },
        },
        required: ["kind"],
      },
    },
  },
];

type ToolCall = { name: string; args: any; id?: string };

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
      const url = new URL(req.url);
      const provided = (
        req.headers.get("x-webhook-secret") ||
        req.headers.get("x-evolution-secret") ||
        req.headers.get("client-token") ||
        req.headers.get("apikey") ||
        url.searchParams.get("secret") ||
        ""
      ).trim();
      const expected = expectedSecretRaw.trim();
      const expectedCandidates = new Set<string>([expected]);

      try {
        const expectedUrl = new URL(expected);
        const secretFromUrl = expectedUrl.searchParams.get("secret")?.trim();
        if (secretFromUrl) expectedCandidates.add(secretFromUrl);

        const currentUrl = new URL(req.url);
        const expectedPath = expectedUrl.pathname.replace(/^\/functions\/v1/, "");
        if (!secretFromUrl && expectedPath.endsWith(currentUrl.pathname) && provided.length >= 8) {
          expectedCandidates.add(provided);
        }
      } catch {
        const secretFromText = expected.match(/[?&]secret=([^&\s]+)/)?.[1];
        if (secretFromText) expectedCandidates.add(decodeURIComponent(secretFromText).trim());
      }

      if (!expectedCandidates.has(provided)) {
        const mask = (s: string) => s ? `${s.slice(0, 3)}…(${s.length})` : "(empty)";
        console.warn(
          `[whatsapp-webhook] invalid_secret. provided=${mask(provided)} expected_prefix=${mask(expected)} candidates=${expectedCandidates.size} url=${req.url}`
        );
        return new Response(
          JSON.stringify({
            error: "invalid_secret",
            hint: "Configure o webhook da Evolution com ?secret=<WHATSAPP_WEBHOOK_SECRET> ou header apikey/x-webhook-secret igual ao secret do projeto.",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const body = await req.json();
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

    await supabase.from("whatsapp_messages").insert({
      conversation_id: conv.id,
      external_id: externalId,
      direction: "inbound",
      author: "lead",
      content,
      status: "delivered",
      timestamp: ts,
    });

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
            update.etapa_funil = "Em Atendimento";
          }
          if (Object.keys(update).length > 1) {
            await supabase.from("leads").update(update).eq("id", leadUuid);
          }
          toolResult = { ok: true, saved: Object.keys(update).filter(k => k !== "ultima_interacao") };
          needAnotherRound = true;
        } else if (tc.name === "send_booking_link") {
          const k = tc.args?.kind;
          if (["videochamada", "presencial", "ligacao"].includes(k)) {
            bookingKind = k;
          }
          toolResult = { ok: true, scheduled: bookingKind };
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

    if (bookingKind) {
      const labels: Record<string, string> = {
        videochamada: "uma videochamada",
        presencial: "uma reunião presencial",
        ligacao: "uma ligação",
      };
      if (!/hans/i.test(reply)) {
        reply += `\n\nÓtimo! O Hans vai confirmar ${labels[bookingKind]} com você em breve.`;
      }

      if (leadUuid) {
        const note = `📞 Lead solicitou: ${labels[bookingKind]}`;
        const { data: cur } = await supabase.from("leads").select("observacoes, etapa_funil").eq("id", leadUuid).maybeSingle();
        await supabase.from("leads").update({
          observacoes: cur?.observacoes ? `${cur.observacoes}\n${note}` : note,
          etapa_funil: cur?.etapa_funil === "Novo Lead" ? "Em Atendimento" : cur?.etapa_funil,
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
