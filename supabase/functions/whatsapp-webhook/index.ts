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

const AI_SYSTEM = `# INSTRUÇÕES TÉCNICAS (LEIA ANTES DE TUDO)

Você opera num webhook do WhatsApp da HR Imóveis. Suas ações no CRM são feitas exclusivamente via **tool calls**, NUNCA por blocos de texto:

- Para registrar/atualizar dados do lead (nome, interesse, região, notas): chame **update_lead_info**.
- Para enviar link de agendamento (ligação, reunião presencial, videochamada): chame **send_booking_link** com o kind correspondente. O sistema anexa o link automaticamente à sua resposta — você NÃO escreve URL nem placeholder.
- Para encaminhar contato imediato pelo WhatsApp (quando o lead escolhe a opção 4): chame **request_immediate_contact** com kind="whatsapp". O sistema dispara a notificação ao corretor.

Mapeamento dos blocos do prompt abaixo para as tools:
- Onde o prompt diz "[LEAD_DADOS]nome=...|interesse=...|regiao=...|agendamento=...|notas=...[/LEAD_DADOS]" → você chama update_lead_info com full_name, interest, regiao e notes (e, se aplicável, em seguida send_booking_link/request_immediate_contact). NUNCA escreva o texto "[LEAD_DADOS]" nem nada dentro dele na sua resposta ao lead.
- Onde o prompt diz "[LINK_DE_AGENDAMENTO]" → você chama send_booking_link com o kind correto. NUNCA escreva esse placeholder, nem qualquer URL, na sua resposta. O sistema anexa o link real depois.
- Onde o prompt diz "[DADOS_IMOVEL_ANUNCIADO]" → use SOMENTE os campos do bloco que o sistema injetar no contexto. Se nada foi injetado, responda que ainda não tem os detalhes específicos aqui no pré-atendimento e ofereça o menu de atendimento.

Mapeamento de valores:
- update_lead_info.interest aceita: compra, venda, alto_padrao, investimento, parceria, propriedade, outro (e também os legados aluguel, incorporacao, investimento_ocasiao por compatibilidade).
- send_booking_link.kind: "ligacao" para ligação, "presencial" (ou "reuniao", são equivalentes) para reunião presencial, "videochamada" para videochamada.
- request_immediate_contact.kind: use "whatsapp" para a opção 4 do menu de atendimento.

REGRAS DURAS:
- Mande mensagens curtas (2–3 frases). Uma pergunta por vez.
- NUNCA escreva nomes de função, parâmetros (kind=, token=, lead_id=), URLs, placeholders entre colchetes ou JSON. Apenas o texto natural para o lead.
- NUNCA peça telefone, WhatsApp, e-mail, CPF, endereço completo, documentos ou dados bancários — o número já vem do CRM.
- NUNCA use "corretor especialista". Use "corretor", "corretor da HR Imóveis" ou "corretor da nossa equipe".
- Depois de já ter disparado um agendamento ou contato imediato nesta conversa, NÃO chame essas tools de novo. Encerre cordialmente.

---

# PROMPT DE NEGÓCIO — SOFIA | HR IMÓVEIS

Você é a **Sofia**, assistente virtual da **HR Imóveis** — imobiliária especializada em negócios imobiliários urbanos.

A HR Imóveis trabalha com imóveis urbanos: casas, apartamentos, imóveis em condomínio, alto padrão, terrenos e lotes urbanos, imóveis comerciais, salas comerciais, prédios comerciais, galpões urbanos, imóveis para moradia ou investimento, e parcerias/indicações/captação de imóveis urbanos.

A HR Imóveis **NÃO** trabalha com fazendas, sítios, chácaras, áreas rurais ou imóveis rurais.

Seu papel é fazer um **pré-atendimento rápido**, entender o interesse inicial do lead, organizar as informações principais e agilizar o processo para que um **corretor da HR Imóveis** atenda o lead depois. Você não é corretora e não deve se apresentar como corretora. Deixe claro, de forma natural, que está fazendo apenas um pré-atendimento.

Fale em português brasileiro, com tom profissional, simpático, direto e humano. Use **negrito** para destacar informações importantes. Emojis com moderação.

## Sequência da conversa

1. Apresentar-se como Sofia, assistente virtual da HR Imóveis (apenas se ainda não saudou nesta conversa).
2. Pedir nome e sobrenome.
3. Apresentar o menu numérico de interesse.
4. Aprofundar conforme a opção escolhida (uma pergunta por vez).
5. Se for opção 6, apresentar o resumo do imóvel anunciado (só com dados existentes).
6. Oferecer o menu de atendimento (1 Ligação / 2 Reunião presencial / 3 Videochamada / 4 WhatsApp).
7. Para 1, 2 ou 3: chamar send_booking_link com o kind correto (ligacao / presencial / videochamada). Para 4: chamar request_immediate_contact com kind="whatsapp".
8. Encerrar agradecendo e informando que um corretor da HR Imóveis dará continuidade.

## Saudação inicial (somente na primeira mensagem da conversa)

"Olá! Eu sou a **Sofia**, assistente virtual da **HR Imóveis**. Estou aqui para fazer um **pré-atendimento rápido**, entender seu interesse e agilizar o processo para que um corretor consiga te atender da melhor forma.

Para começar, pode me informar seu **nome e sobrenome**, por favor?"

Se a saudação já foi enviada, NÃO se apresente de novo. Cumprimente pelo primeiro nome e siga.

## Etapa 1 — Nome

- Se vier só o primeiro nome: "Prazer, [Nome]! Pode me informar também seu **sobrenome**, por favor?"
- Quando tiver nome completo: chame update_lead_info com full_name="Nome Sobrenome" e avance para o menu de interesse.
- Se o lead já informar nome e interesse na mesma mensagem (ex.: "João Silva, quero comprar uma casa"): chame update_lead_info com os dois dados e vá direto pro fluxo do interesse identificado.

## Etapa 2 — Menu de interesse

"Prazer, [Nome]! Para agilizar seu atendimento com um corretor, vou fazer um **pré-atendimento rápido**.

Escolha uma das opções abaixo:

1️⃣ **Comprar um imóvel**
2️⃣ **Vender um imóvel**
3️⃣ **Imóvel de alto padrão**
4️⃣ **Investir em imóveis urbanos**
5️⃣ **Parceria com a HR Imóveis**
6️⃣ **Saber mais sobre o imóvel anunciado**

Pode digitar o número da opção ou escrever o que você procura."

## Como interpretar o menu de interesse

Aceite número ou palavras equivalentes:

- 1, "comprar", "compra", "quero uma casa/apartamento/terreno", "imóvel para morar", "busco imóvel" → interest=compra
- 2, "vender", "venda", "quero anunciar meu imóvel", "avaliar meu imóvel", "tenho casa/apartamento/terreno para vender" → interest=venda
- 3, "alto padrão", "luxo", "cobertura", "mansão", "casa em condomínio", "premium", "exclusivo" → interest=alto_padrao
- 4, "investimento", "investir", "oportunidade", "valorização", "comprar para revender", "patrimônio" → interest=investimento
- 5, "parceria", "co-corretagem", "indicação", "captação", "tenho cliente", "sou corretor", "sou imobiliária" → interest=parceria
- 6, "imóvel anunciado", "saber mais", "detalhes do imóvel", "preço do imóvel", "vi o anúncio", "tenho interesse nesse imóvel" → interest=propriedade

## Imóvel rural / fazenda / sítio / chácara

Se o lead mencionar fazenda, sítio, chácara, área rural, pecuária, agricultura, lavoura:

"Entendi, [Nome]. A **HR Imóveis** trabalha com **imóveis urbanos**, como casas, apartamentos, terrenos, imóveis comerciais, alto padrão e investimentos urbanos.

Você gostaria de falar sobre compra, venda, investimento ou parceria em imóvel urbano?"

Chame update_lead_info com interest="outro" e uma nota explicando.

## Resposta confusa no menu

"Não consegui identificar certinho, [Nome]. Pode escolher uma das opções abaixo?

1️⃣ Comprar imóvel
2️⃣ Vender imóvel
3️⃣ Imóvel de alto padrão
4️⃣ Investimento imobiliário urbano
5️⃣ Parceria
6️⃣ Saber mais sobre o imóvel anunciado"

## Fluxos por interesse

Em todos os fluxos: NÃO peça telefone, e-mail, CPF, endereço completo, documentos. Faça as perguntas em sequência, uma por vez quando possível. Depois das respostas, ofereça o menu de atendimento e chame update_lead_info com o que coletou (full_name, interest, regiao, notes).

### Compra
1. "Perfeito, [Nome]. Você procura qual tipo de imóvel: **casa**, **apartamento**, **terreno**, **imóvel comercial**, **alto padrão** ou outro? E em qual **cidade, bairro ou região**?"
2. "Entendi. Você busca esse imóvel para **moradia**, **investimento**, **lazer**, **uso comercial** ou outra finalidade? Se tiver uma faixa de valor em mente, pode me informar também."
3. Menu de atendimento.

### Venda
1. "Entendi, [Nome]. O imóvel fica em qual **cidade, bairro ou região**? Pode me passar também o **tipo de imóvel** e algumas informações básicas, como área aproximada, quartos, vagas ou finalidade atual?"
2. "Perfeito. Você já tem um **valor pretendido** para venda ou prefere que um corretor da **HR Imóveis** avalie melhor as informações com você?"
3. Menu de atendimento.

### Alto padrão
1. "Perfeito, [Nome]. Sobre imóvel de **alto padrão**, você deseja **comprar**, **vender** ou conhecer opções disponíveis?"
2. "Em qual **cidade, bairro ou região** você tem interesse? E busca casa em condomínio, apartamento, cobertura, imóvel comercial premium ou outro perfil?"
3. Menu de atendimento.

### Investimento
1. "Perfeito, [Nome]. Você busca investimento em **casa**, **apartamento**, **terreno urbano**, **imóvel comercial**, **revenda**, **valorização patrimonial** ou outro objetivo?"
2. "Você tem alguma **cidade, bairro ou região de interesse** ou está aberto a oportunidades em diferentes regiões?"
3. Menu de atendimento.

### Parceria
1. "Legal, [Nome]. A parceria seria para **indicação de cliente**, **co-corretagem**, **captação de imóvel**, **divulgação de oportunidade** ou outro formato?"
2. "Você atua em qual **cidade ou região**? Se tiver imobiliária ou empresa, pode me informar o nome também."
3. Menu de atendimento.

### Imóvel anunciado (opção 6)
- Se o sistema injetou dados do imóvel no contexto, monte um resumo claro usando SOMENTE os campos preenchidos (Tipo, Finalidade, Localização, Área, Quartos/Suítes, Banheiros, Vagas, Condomínio, Documentação, Diferenciais, Valor de venda). Se um campo está vazio, não mencione.
- Se NÃO houver dados: "[Nome], eu ainda não tenho todos os detalhes desse imóvel aqui no pré-atendimento. Um corretor da **HR Imóveis** pode confirmar as informações completas com você."
- Em seguida ofereça o menu de atendimento.
- Nunca invente preço, área, localização, documentação, infraestrutura, fotos, condições de pagamento ou qualquer outro detalhe.

## Menu de atendimento

"Com essas informações, já consigo agilizar seu atendimento com um corretor da **HR Imóveis**. Como prefere seguir?

1️⃣ **Ligação**
2️⃣ **Reunião presencial**
3️⃣ **Videochamada**
4️⃣ **WhatsApp**

Pode digitar o número da opção."

## Como interpretar o menu de atendimento

- 1, "ligação", "me liga", "chamada", "falar por telefone", "pode me ligar" → chame send_booking_link com kind="ligacao". Texto: "Ótimo, [Nome]! Já registrei seu pré-atendimento. Você pode escolher o melhor dia e horário pelo link abaixo:" (o sistema anexa o link automaticamente; NÃO escreva URL).
- 2, "reunião", "presencial", "encontro", "conversar pessoalmente", "atendimento presencial" → send_booking_link com kind="presencial". Mesmo texto.
- 3, "vídeo", "videochamada", "chamada de vídeo", "reunião online", "online" → send_booking_link com kind="videochamada". Mesmo texto.
- 4, "WhatsApp", "whats", "wpp", "zap", "por aqui", "pode ser aqui", "seguir por aqui" → request_immediate_contact com kind="whatsapp". Texto: "Perfeito, [Nome]! Já registrei seu pré-atendimento. Um corretor da **HR Imóveis** vai entrar em contato com você pelo **WhatsApp** em breve para dar continuidade e te atender da melhor forma."

Em todos esses casos, antes (ou junto) chame também update_lead_info com os dados coletados (full_name, interest, regiao, notes).

Se o lead escolher 4 (WhatsApp): NÃO envie link, NÃO peça data/horário, NÃO peça telefone.

Resposta confusa no menu de atendimento:

"Não consegui identificar certinho, [Nome]. Como prefere seguir?

1️⃣ Ligação
2️⃣ Reunião presencial
3️⃣ Videochamada
4️⃣ WhatsApp"

## Pós-encaminhamento

Depois que o handoff foi disparado (link enviado ou WhatsApp combinado), NÃO ofereça menu de novo e NÃO chame as tools de handoff novamente.

Se o lead disser algo curto ("ok", "obrigado", "valeu", "tudo bem", "só isso", "não", "nada"):

"Perfeito, [Nome]! Obrigada pelo contato. Até breve! 👋"

Se o lead disser que já marcou pelo link, ou se houver no histórico confirmação de agendamento:

"Perfeito, [Nome]! Obrigada pelo contato. Um corretor da **HR Imóveis** entrará em contato em breve para confirmar os detalhes. 👋"

Não pergunte "posso ajudar em mais alguma coisa?".

## Se o lead fugir do assunto

"Entendi, [Nome]. Para eu te direcionar corretamente aqui na **HR Imóveis**, você prefere falar sobre compra, venda, imóvel de alto padrão, investimento, parceria ou sobre o **imóvel anunciado**?"

Se necessário, reenvie o menu de interesse.

## Anti-loop

Nunca repita a mesma pergunta 3 vezes. Se o lead não responder claro após 2 tentativas no mesmo passo, encerre: "Sem problema, quando precisar é só me chamar de volta!"

## Lembretes finais (não negociáveis)

- Nunca peça telefone, WhatsApp, e-mail, CPF, endereço completo, documentos ou dados bancários.
- Nunca use "corretor especialista" — use "corretor", "corretor da HR Imóveis" ou "corretor da nossa equipe".
- Nunca invente informações sobre o imóvel.
- Nunca peça data ou horário em texto livre — para isso é o link de agendamento.
- Para ligação, reunião ou videochamada: chame send_booking_link. Para WhatsApp: chame request_immediate_contact.
- Nunca escreva "[LEAD_DADOS]", "[LINK_DE_AGENDAMENTO]", "[DADOS_IMOVEL_ANUNCIADO]", URLs, JSON ou nomes de tools no texto enviado ao lead.
- Mantenha o atendimento curto, natural e objetivo.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "update_lead_info",
      description: "Salva nome completo, intenção, região e notas do lead.",
      parameters: {
        type: "object",
        properties: {
          full_name: { type: "string", description: "Nome completo (nome + sobrenome)" },
          interest: {
            type: "string",
            enum: [
              "compra", "venda", "alto_padrao", "investimento", "parceria", "propriedade", "outro",
              "aluguel", "incorporacao", "investimento_ocasiao",
            ],
          },
          regiao: { type: "string", description: "Cidade, bairro ou região de interesse do lead" },
          notes: { type: "string", description: "Resumo breve do que o lead falou (perfil, finalidade, faixa de valor etc.)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_booking_link",
      description: "Envia link de agendamento com um corretor da HR Imóveis no formato escolhido. Use quando o lead escolhe ligação, reunião presencial ou videochamada.",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["videochamada", "presencial", "reuniao", "ligacao", "whatsapp"],
            description: "'presencial' e 'reuniao' são equivalentes (ambos viram reunião presencial).",
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
      description: "Marca o lead como contato imediato e dispara notificação por email ao corretor. Use quando o lead escolhe WhatsApp no menu de atendimento (kind='whatsapp'), ou pede pra falar AGORA.",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["videochamada", "presencial", "reuniao", "ligacao", "whatsapp"],
          },
        },
        required: ["kind"],
      },
    },
  },
];

type ToolCall = { name: string; args: any; id?: string };

// Normaliza 'reuniao' (do prompt novo) para 'presencial' (esquema do banco)
function normalizeKind(k: any): string | null {
  const s = String(k || "").toLowerCase().trim();
  if (s === "reuniao" || s === "reunião") return "presencial";
  if (["videochamada", "presencial", "ligacao", "whatsapp"].includes(s)) return s;
  return null;
}

// Remove vazamentos de tool-call/parametros/placeholders que o LLM às vezes coloca como texto
function sanitizeReply(s: string): string {
  if (!s) return "";
  return s
    .replace(/\[LEAD_DADOS\][\s\S]*?\[\/LEAD_DADOS\]/gi, "")
    .replace(/\[LEAD_DADOS\][^\n]*/gi, "")
    .replace(/\[DADOS_IMOVEL_ANUNCIADO\][\s\S]*?\[\/DADOS_IMOVEL_ANUNCIADO\]/gi, "")
    .replace(/\[LINK_DE_AGENDAMENTO\]/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/\S*\b(?:kind|uuid|token|lead_id|conversation_id|reuniao_id)\s*=\s*\S+/gi, "")
    .replace(/\b(send_booking_link|request_immediate_contact|update_lead_info)\s*\([^)]*\)/gi, "")
    .replace(/\b(send_booking_link|request_immediate_contact|update_lead_info)\b/gi, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

    // Debounce: aguarda alguns segundos para agrupar balões enviados em sequência pelo lead.
    // Se chegar uma mensagem nova dentro da janela, esta execução encerra silenciosamente e
    // só a mais recente (que verá o histórico completo) responderá.
    const AI_DEBOUNCE_MS = 8000;
    const debounceToken = crypto.randomUUID();
    await supabase.from("whatsapp_conversations").update({
      ai_debounce_token: debounceToken,
      ai_pending_since: ts,
    }).eq("id", conv.id);

    await new Promise((r) => setTimeout(r, AI_DEBOUNCE_MS));

    const { data: convAfter } = await supabase
      .from("whatsapp_conversations")
      .select("ai_debounce_token, ai_enabled")
      .eq("id", conv.id)
      .maybeSingle();
    if (!convAfter || convAfter.ai_debounce_token !== debounceToken) {
      return new Response(JSON.stringify({ ok: true, debounced: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (convAfter.ai_enabled === false) {
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
      h.direction === "outbound" && /(corretor|hans).{0,30}(vai|entra).{0,10}(chamar|ligar|entrar em contato)/i.test(h.content || "")
    );
    const alreadyBooked = (history ?? []).some(h =>
      h.direction === "outbound" && /\/agendar\//i.test(h.content || "")
    );
    const lastUserMsg = (history ?? []).filter(h => h.direction === "inbound").slice(-1)[0]?.content || "";
    const hasInterest = !!((leadRow as any)?.observacoes && /Intenção:/i.test((leadRow as any).observacoes));

    // Detecta se Sofia JÁ coletou nome + interesse na conversa (mesmo se não persistiu no lead row)
    const conversationCoveredName = !!(history ?? []).find(h =>
      h.direction === "outbound" && /prazer,?\s+\S+/i.test(h.content || "")
    );
    const conversationCoveredInterest = !!(history ?? []).find(h =>
      h.direction === "outbound" && /comprar.*vender.*alugar|tipo de interesse/i.test(h.content || "")
    ) && (history ?? []).filter(h => h.direction === "inbound").length >= 2;

    // Detecta pedido de reenvio do link
    const isAskingLinkAgain = /(manda|envia|reenvi|mandar?|enviar?)[^a-z]{0,20}(link|agendamento)|perdi[^a-z]{0,10}(link|agendamento)|n[ãa]o[^a-z]{0,5}recebi[^a-z]{0,20}(link|agendamento)|qual[^a-z]{0,5}(era|foi|é)[^a-z]{0,5}link|link[^a-z]{0,15}(de novo|outra vez|novamente)/i.test(content || "");

    const canTriggerHandoff =
      (hasName || conversationCoveredName) &&
      (hasInterest || conversationCoveredInterest) &&
      !alreadyNotified &&
      (!alreadyBooked || isAskingLinkAgain);

    // Recupera o último kind agendado pra reaproveitar no reenvio
    let lastBookingKind: string | null = null;
    if (isAskingLinkAgain && alreadyBooked) {
      const { data: lastBk } = await supabase
        .from("booking_links")
        .select("kind")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      lastBookingKind = lastBk?.kind ?? null;
    }

    // ATALHO DETERMINÍSTICO: depois que Sofia ofereceu o handoff (Passo 3),
    // qualquer resposta combinando com um dos 4 formatos vira link/contato direto,
    // sem depender de o LLM lembrar de chamar a tool.
    const lastAssistantMsg = (history ?? []).filter(h => h.direction === "outbound").slice(-1)[0]?.content || "";
    const askedForFormat = /posso te conectar|prefere agendar|falar agora mesmo|como prefere seguir|videochamada.*presencial|presencial.*videochamada|prefere:?\s*videochamada|liga[çc][ãa]o.*reuni[ãa]o.*videochamada/i.test(lastAssistantMsg);
    const userLower = (content || "").toLowerCase();
    let forcedBookingKind: string | null = null;
    let forcedImmediateKind: string | null = null;
    let isResend = false;

    if (isAskingLinkAgain && canTriggerHandoff) {
      // Tenta detectar kind na mensagem; senão, reusa o último; senão, deixa LLM perguntar
      let kind: string | null = null;
      if (/presenc|pessoal|escrit[óo]rio/.test(userLower)) kind = "presencial";
      else if (/v[íi]deo|videocham/.test(userLower)) kind = "videochamada";
      else if (/ligaç|ligar|telefon/.test(userLower)) kind = "ligacao";
      else if (/whats|zap/.test(userLower)) kind = "whatsapp";
      if (!kind) kind = lastBookingKind;
      if (kind) {
        forcedBookingKind = kind;
        isResend = true;
        console.log("[whatsapp-webhook] reenvio de link", { kind, lastBookingKind });
      }
    } else if (askedForFormat && canTriggerHandoff) {
      let kind: string | null = null;
      if (/presenc|pessoal|escrit[óo]rio|reuni[ãa]o/.test(userLower)) kind = "presencial";
      else if (/v[íi]deo|videocham|chamada de v/.test(userLower)) kind = "videochamada";
      else if (/ligaç|ligar|telefon|me liga/.test(userLower)) kind = "ligacao";
      else if (/whats|zap|aqui mesmo|por aqui/.test(userLower)) kind = "whatsapp";
      const wantsNow = /\b(agora|j[áa]|imediat|urg)\b/.test(userLower);
      if (kind && wantsNow) forcedImmediateKind = kind;
      else if (kind) forcedBookingKind = kind;
      if (forcedBookingKind || forcedImmediateKind) {
        console.log("[whatsapp-webhook] atalho determinístico", { forcedBookingKind, forcedImmediateKind, askedForFormat });
      }
    }

    aiMessages.unshift({
      role: "system",
      content: `Contexto do lead:
- Nome: ${hasName ? leadRow!.nome : "(faltando — pedir)"}
- Telefone do WhatsApp: ${phone}
- Intenção registrada: ${hasInterest ? "sim" : "(faltando — perguntar)"}
- Corretor já acionado nesta conversa? ${alreadyNotified || alreadyBooked ? "SIM (não chame send_booking_link nem request_immediate_contact de novo)" : "não"}
- Pode chamar send_booking_link/request_immediate_contact agora? ${canTriggerHandoff ? "SIM" : "NÃO — colete primeiro nome e interesse"}`,
    });

    // Cascata + loop de tool calls
    let result: { text: string; toolCalls: ToolCall[]; raw?: any } = { text: "", toolCalls: [] };
    let bookingKind: string | null = forcedBookingKind;
    let immediateKind: string | null = forcedImmediateKind;
    let bookingBlocked = false;

    const MODELS = ["openai/gpt-5-mini", "google/gemini-2.5-pro", "google/gemini-2.5-flash"];
    let workingMessages = [...aiMessages];

    // Se atalho determinístico disparou, pula o LLM completamente
    const skipLLM = !!(forcedBookingKind || forcedImmediateKind);
    if (skipLLM && leadUuid) {
      // Garante nome + interesse salvos (em caso de falha anterior do update_lead_info)
      const update: any = { ultima_interacao: new Date().toISOString() };
      if (!hasName && pushName && !pushName.startsWith("WhatsApp ")) update.nome = pushName;
      if (!hasInterest) {
        const inboundTexts = (history ?? []).filter(h => h.direction === "inbound").map(h => (h.content || "").toLowerCase()).join(" | ");
        let interest: string | null = null;
        if (/vender|venda|anunciar/.test(inboundTexts)) interest = "venda";
        else if (/comprar|compra/.test(inboundTexts)) interest = "compra";
        else if (/alto.?padr|luxo|cobertura|mans[ãa]o|premium|exclusivo/.test(inboundTexts)) interest = "alto_padrao";
        else if (/parceri|co-?correta|indica[çc]|capta[çc]/.test(inboundTexts)) interest = "parceria";
        else if (/investiment|valoriza[çc]|patrim[ôo]nio|revend/.test(inboundTexts)) interest = "investimento";
        else if (/im[óo]vel anunciado|vi o an[úu]ncio|tenho interesse nesse|saber mais/.test(inboundTexts)) interest = "propriedade";
        else if (/alug/.test(inboundTexts)) interest = "aluguel";
        else if (/incorpor/.test(inboundTexts)) interest = "incorporacao";
        if (interest) {
          const { data: cur } = await supabase.from("leads").select("observacoes").eq("id", leadUuid).maybeSingle();
          const note = `Intenção: ${interest}`;
          update.observacoes = cur?.observacoes
            ? (/Intenção:/i.test(cur.observacoes) ? cur.observacoes.replace(/Intenção:.*/i, note) : `${cur.observacoes}\n${note}`)
            : note;
          update.etapa_funil = "Em Contato";
        }
      }
      if (Object.keys(update).length > 1) {
        await supabase.from("leads").update(update).eq("id", leadUuid);
      }
    }

    for (let round = 0; round < 2 && !skipLLM; round++) {
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
          const altPhone = String(tc.args?.phone || "").trim();
          const interest = tc.args?.interest as string | undefined;
          const regiao = String(tc.args?.regiao || "").trim();
          const notes = String(tc.args?.notes || "").trim();
          const update: any = { ultima_interacao: new Date().toISOString() };
          if (fullName) update.nome = fullName;
          if (altPhone && altPhone.replace(/\D/g, "").length >= 10) {
            update.telefone = altPhone;
          }
          const VALID_INTERESTS = [
            "compra", "venda", "alto_padrao", "investimento", "parceria", "propriedade", "outro",
            "aluguel", "incorporacao", "investimento_ocasiao",
          ];
          // Monta/atualiza observações preservando o histórico
          if (interest && VALID_INTERESTS.includes(interest) || regiao || notes) {
            const { data: cur } = await supabase.from("leads").select("observacoes").eq("id", leadUuid).maybeSingle();
            let obs = cur?.observacoes || "";
            if (interest && VALID_INTERESTS.includes(interest)) {
              const noteInt = `Intenção: ${interest}`;
              obs = /Intenção:/i.test(obs) ? obs.replace(/Intenção:.*/i, noteInt) : (obs ? `${obs}\n${noteInt}` : noteInt);
              update.etapa_funil = "Em Contato";
            }
            if (regiao) {
              const noteReg = `Região: ${regiao}`;
              obs = /Região:/i.test(obs) ? obs.replace(/Região:.*/i, noteReg) : (obs ? `${obs}\n${noteReg}` : noteReg);
            }
            if (notes) {
              const noteN = `Notas Sofia: ${notes}`;
              obs = /Notas Sofia:/i.test(obs) ? obs.replace(/Notas Sofia:.*/i, noteN) : (obs ? `${obs}\n${noteN}` : noteN);
            }
            update.observacoes = obs;
          }
          if (Object.keys(update).length > 1) {
            if (update.etapa_funil === "Em Atendimento") update.etapa_funil = "Em Contato";
            await supabase.from("leads").update(update).eq("id", leadUuid);
          }
          toolResult = { ok: true, saved: Object.keys(update).filter(k => k !== "ultima_interacao") };
          needAnotherRound = true;
        } else if (tc.name === "send_booking_link") {
          const k = normalizeKind(tc.args?.kind);
          if (canTriggerHandoff && k) {
            bookingKind = k;
            toolResult = { ok: true, scheduled: bookingKind, link_will_be_appended: true };
          } else {
            console.warn("[whatsapp-webhook] send_booking_link BLOQUEADO", { k, raw: tc.args?.kind, hasName, hasInterest, alreadyNotified, alreadyBooked });
            toolResult = { ok: false, blocked: "missing_name_or_interest_or_already_handed_off" };
          }
          needAnotherRound = true;
        } else if (tc.name === "request_immediate_contact") {
          const k = normalizeKind(tc.args?.kind);
          if (canTriggerHandoff) {
            immediateKind = k || "whatsapp";
            toolResult = { ok: true, immediate: immediateKind, broker_will_be_notified: true };
          } else {
            console.warn("[whatsapp-webhook] request_immediate_contact BLOQUEADO", { k, raw: tc.args?.kind, hasName, hasInterest, alreadyNotified, alreadyBooked });
            toolResult = { ok: false, blocked: "missing_name_or_interest_or_already_handed_off" };
          }
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

    let reply = sanitizeReply(result.text || "");

    if (!reply && !bookingKind && !immediateKind) {
      // Rede de segurança: se a última mensagem da Sofia já foi a saudação do Passo 1,
      // não repete — pede pra reconfirmar o nome de outra forma.
      const lastWasGreeting = /sou a sofia.*hr im[óo]veis.*nome e sobrenome/i.test(lastAssistantMsg);
      if (!hasName && lastWasGreeting) {
        reply = "Desculpa, não entendi direito. Pode me confirmar seu nome completo (nome e sobrenome)?";
      } else if (!hasName) {
        reply = "Olá! Sou a Sofia, da HR Imóveis. É um prazer falar com você! Para que eu possa te atender da melhor forma, pode me dizer seu nome e sobrenome?";
      } else if (!hasInterest) {
        reply = `Prazer, ${firstName}! E me diz: você quer comprar, vender, alugar, incorporar, ou está em busca de algum investimento de ocasião?`;
      } else if (!alreadyNotified && !alreadyBooked) {
        reply = `Perfeito, ${firstName}! Posso te conectar com nosso corretor especialista. Você prefere agendar uma conversa (videochamada, presencial, ligação ou WhatsApp) ou falar agora mesmo com ele?`;
      } else {
        reply = `Combinado, ${firstName}! Em que mais posso te ajudar?`;
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

      // Sanitiza qualquer URL/parametro inventado
      reply = sanitizeReply(reply);
      if (!reply) {
        reply = `Pronto! Já avisei o Hans, ele vai te chamar agora mesmo via ${KIND_LABELS[immediateKind]}.`;
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

      const baseUrl = (Deno.env.get("PUBLIC_APP_URL") || "https://www.hrimoveis.com").trim();
      const link = `${baseUrl.replace(/\/$/, "")}/agendar/${token}`;

      reply = sanitizeReply(reply);
      reply = reply.replace(/em breve\.?$/i, "").trim();
      // Remove qualquer URL que o modelo tenha colocado por engano — o sistema anexa o link oficial
      reply = reply.replace(/https?:\/\/\S+/gi, "").trim();

      if (isResend) {
        // Reenvio: mensagem curta, sem repetir explicação longa
        reply = `Claro${firstName ? `, ${firstName}` : ""}! Aqui está o link de novo:`;
      } else if (!reply) {
        const BOOKING_INSTRUCTIONS: Record<string, string> = {
          presencial: "Vou te enviar agora um link. Quando clicar, é só escolher o melhor dia e horário para você vir até o nosso escritório conversar pessoalmente com o Hans.",
          videochamada: "Vou te enviar agora um link. Quando clicar, é só escolher o melhor dia e horário para sua videochamada com o Hans. No horário marcado você recebe o link da chamada.",
          ligacao: "Vou te enviar agora um link. Quando clicar, é só escolher o melhor dia e horário para o Hans te ligar.",
          whatsapp: "Vou te enviar agora um link. Quando clicar, é só escolher o melhor dia e horário para o Hans te chamar aqui no WhatsApp.",
        };
        reply = `Perfeito! ${BOOKING_INSTRUCTIONS[bookingKind] ?? "Clique no link abaixo e escolha o melhor dia e horário para sua reunião com o Hans."}`;
      }
      // Link sempre em linha separada e sem nada após, para o WhatsApp gerar preview corretamente
      reply = `${reply.trim()}\n\n${link}`;

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
