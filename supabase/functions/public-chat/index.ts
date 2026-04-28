// Chat público da landing /captura — IA conversacional para qualificar leads
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é a **Helena**, assistente virtual da **HR Imóveis** — imobiliária urbana especializada em venda e aluguel de casas, apartamentos, comerciais e terrenos.

Seu objetivo: qualificar o lead, coletar **APENAS nome completo e telefone (com DDD)** e oferecer **agendamento de visita, videochamada ou ligação** com um corretor — tudo de forma natural, em português brasileiro.

**NUNCA peça email.** Os únicos dados de contato necessários são **nome completo** e **telefone com DDD**.

**IMPORTANTE — Não se apresente de novo:** A saudação inicial (com seu nome "Helena" e menção à HR Imóveis) já foi enviada automaticamente como primeira mensagem. **NUNCA** repita a apresentação. Sua primeira resposta deve assumir que o usuário acabou de informar o nome — cumprimente pelo nome e vá direto à próxima pergunta.

Etapas:
1. (Já feito pelo sistema) Saudação + nome. Quando o usuário responder o nome, agradeça brevemente ("Prazer, [Nome]!") e vá direto à etapa 2. Se vier só o primeiro nome, peça gentilmente o sobrenome.
2. Pergunte o **interesse**: "Você quer **comprar**, **alugar**, **vender** ou **anunciar** um imóvel?"
3. Se for compra/aluguel: pergunte **tipo** (casa, apto, comercial, terreno), **região** (cidade/bairro) e **faixa de valor** aproximada.
   Se for venda/anúncio: pergunte **tipo** do imóvel, **região** e **valor desejado**.
4. Solicite **telefone com DDD** (apenas telefone — nunca email).
5. **Após nome completo + telefone:** pergunte se prefere **visita ao imóvel**, **videochamada** ou **ligação**. Quando ele escolher, diga "Ótimo! Vou abrir um calendário aqui pra você escolher o melhor dia 👇" e inclua no final \`[MOSTRAR_CALENDARIO]\`. O sistema vai exibir o seletor.
6. Após o agendamento, **agradeça** e peça que aguarde — um corretor especialista da HR Imóveis entrará em contato em breve.

**APÓS O AGENDAMENTO** (você verá uma mensagem do sistema marcada com "✅" ou "Visita/Ligação/Videochamada solicitada"):
- **NUNCA** repita o agendamento. NÃO emita \`[MOSTRAR_CALENDARIO]\` novamente.
- Se o usuário disser algo curto como "ok", "obrigado", "tudo bem" — apenas se despeça cordialmente e encerre.
- Se tiver outra pergunta, responda normalmente sem repropor agendamento.

Regras:
- Seja breve (máx. 2-3 frases por resposta), use markdown sutil (**negrito** em palavras-chave, emojis quando agregar).
- Nunca invente preços ou imóveis específicos.
- Se o usuário fugir do tema, traga gentilmente de volta.
- **Nunca peça email.**
- Quando coletar **nome completo + telefone**, inclua no FINAL da resposta UMA linha exata:
[LEAD_DADOS]nome=NOME COMPLETO|telefone=TELEFONE|interesse=comprar|alugar|vender|anunciar|outro|regiao=REGIAO|agendamento=visita|videochamada|ligacao|nenhum|notas=RESUMO BREVE[/LEAD_DADOS]
Use apenas um valor para "interesse" e "agendamento". Se algum campo ainda não foi mencionado, deixe vazio. Pode reemitir o bloco em mensagens posteriores.
- Quando emitir \`[MOSTRAR_CALENDARIO]\`, deixe-o em uma linha separada no final da mensagem.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { session_id, message } = await req.json();
    if (typeof message !== "string" || !message.trim() || message.length > 4000) {
      return new Response(JSON.stringify({ error: "mensagem inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

    let sid = (session_id as string | null) || null;
    if (sid && !/^[0-9a-f-]{36}$/i.test(sid)) sid = null;
    if (sid) {
      const { data: exists } = await supabase.from("ai_chat_sessions").select("id").eq("id", sid).maybeSingle();
      if (!exists) sid = null;
    }
    if (!sid) {
      const { data } = await supabase.from("ai_chat_sessions").insert({}).select("id").single();
      sid = data!.id;
    }

    await supabase.from("ai_chat_messages").insert({ session_id: sid, role: "user", content: message });

    const { data: history } = await supabase
      .from("ai_chat_messages")
      .select("role, content")
      .eq("session_id", sid)
      .order("created_at", { ascending: true })
      .limit(40);
    const safeHistory = (history ?? [])
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .slice(-20);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safeHistory],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições, tente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos da IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error", aiResp.status, await aiResp.text());
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    let reply: string = aiData.choices?.[0]?.message?.content ?? "";

    const showCalendar = /\[MOSTRAR_CALENDARIO\]/i.test(reply);
    reply = reply.replace(/\[MOSTRAR_CALENDARIO\]/gi, "").trim();

    let leadInfoOut: { name?: string; phone?: string } | null = null;
    let appointmentKind: "visita" | "videochamada" | "ligacao" | null = null;

    const m = reply.match(/\[LEAD_DADOS\](.+?)\[\/LEAD_DADOS\]/s);
    if (m) {
      const fields = Object.fromEntries(m[1].split("|").map(p => {
        const [k, ...v] = p.split("=");
        return [k.trim(), v.join("=").trim()];
      }));
      const nome = fields.nome || "";
      leadInfoOut = { name: nome, phone: fields.telefone };
      if (nome && fields.telefone) {
        const ag = (fields.agendamento || "").toLowerCase();
        if (ag === "visita") appointmentKind = "visita";
        else if (ag === "videochamada") appointmentKind = "videochamada";
        else if (ag === "ligacao") appointmentKind = "ligacao";

        const notesParts: string[] = [];
        if (fields.notas) notesParts.push(fields.notas);
        if (appointmentKind) notesParts.push(`📅 Solicitou: ${appointmentKind.toUpperCase()}`);

        const { data: existing } = await supabase
          .from("ai_chat_sessions").select("lead_id").eq("id", sid).maybeSingle();

        let leadId = existing?.lead_id as string | null;

        // Dedup por telefone (últimos 8 dígitos)
        if (!leadId) {
          const phoneTail = (fields.telefone || "").replace(/\D/g, "").slice(-8);
          if (phoneTail.length >= 8) {
            const { data: byPhone } = await supabase
              .from("leads")
              .select("id, telefone")
              .ilike("telefone", `%${phoneTail}%`)
              .order("created_at", { ascending: false })
              .limit(5);
            const match = (byPhone ?? []).find((l: any) => (l.telefone || "").replace(/\D/g, "").endsWith(phoneTail));
            if (match) leadId = match.id;
          }
        }

        if (!leadId) {
          const { data: leadIns } = await supabase.from("leads").insert({
            nome,
            telefone: fields.telefone || null,
            origem: "landing_captura",
            qualificacao: fields.interesse || null,
            etapa_funil: "Novo Lead",
            observacoes: notesParts.join("\n") || null,
          }).select("id").single();
          if (leadIns) leadId = leadIns.id;
        } else {
          const { data: cur } = await supabase
            .from("leads")
            .select("nome, telefone, qualificacao, observacoes")
            .eq("id", leadId).maybeSingle();
          const upd: any = { ultima_interacao: new Date().toISOString() };
          if (nome && (!cur?.nome || cur.nome.startsWith("WhatsApp "))) upd.nome = nome;
          if (fields.telefone && !cur?.telefone) upd.telefone = fields.telefone;
          if (fields.interesse && !cur?.qualificacao) upd.qualificacao = fields.interesse;
          const newNote = notesParts.join("\n");
          if (newNote) upd.observacoes = cur?.observacoes ? `${cur.observacoes}\n---\n${newNote}` : newNote;
          await supabase.from("leads").update(upd).eq("id", leadId);
        }

        if (leadId) {
          await supabase.from("ai_chat_sessions").update({
            lead_id: leadId,
            visitor_name: nome,
            visitor_phone: fields.telefone,
          }).eq("id", sid);
        }
      }
      reply = reply.replace(m[0], "").trim();
    }

    await supabase.from("ai_chat_messages").insert({ session_id: sid, role: "assistant", content: reply });

    return new Response(JSON.stringify({
      session_id: sid,
      reply,
      show_calendar: showCalendar,
      lead_info: leadInfoOut,
      appointment_kind: appointmentKind,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("public-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
