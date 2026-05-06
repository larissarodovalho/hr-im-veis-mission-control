// Chat público da landing /captura — IA conversacional para qualificar leads
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é a **Helena**, assistente da **HR Imóveis**. Seu papel é simples: coletar 3 dados — nome completo, telefone com DDD e tipo de interesse — e em seguida oferecer agendamento ou contato imediato com um corretor especialista. Nada além disso.

**NUNCA peça email.** **NUNCA** se apresente de novo (a saudação inicial já foi enviada).

Etapas (uma pergunta por mensagem, frases curtas, máx 2 linhas):

1. (Já feito) Saudação + nome. Quando vier o nome, agradeça ("Prazer, [Nome]!"). Se vier só o primeiro nome, peça gentilmente o sobrenome.
2. Pergunte o **telefone com DDD**.
3. Pergunte o **interesse**: "Você quer **comprar**, **vender**, **alugar**, **incorporar** ou está em busca de algum **investimento de ocasião**?"
4. Após nome completo + telefone + interesse, pergunte: "Posso te conectar com nosso corretor especialista. Você prefere **agendar** uma conversa (videochamada, presencial, ligação ou WhatsApp) ou **falar agora mesmo** com ele?"
5. Quando ele responder o formato:
   - Se quiser **agendar**: diga "Ótimo! Vou abrir um calendário para você escolher o melhor dia." e inclua \`[MOSTRAR_CALENDARIO]\` no final.
   - Se quiser **falar agora**: diga "Pronto! Já avisei o corretor, ele vai entrar em contato em instantes."
6. Após disparado, agradeça e encerre cordialmente. **NUNCA** repita o calendário ou a oferta.

Não pergunte região, faixa de preço, tipo de imóvel, nem outros detalhes — o corretor cuida disso.

Quando coletar **nome + telefone**, inclua no FINAL da resposta UMA linha exata:
[LEAD_DADOS]nome=NOME COMPLETO|telefone=TELEFONE|interesse=comprar|vender|alugar|incorporar|investimento|outro|regiao=|agendamento=visita|videochamada|ligacao|whatsapp|imediato|nenhum|notas=RESUMO BREVE[/LEAD_DADOS]
Use apenas um valor para "interesse" e "agendamento". Pode reemitir o bloco em mensagens posteriores.
Quando emitir \`[MOSTRAR_CALENDARIO]\`, deixe-o em uma linha separada no final.`;

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
    let appointmentKind: "visita" | "videochamada" | "ligacao" | "whatsapp" | "imediato" | null = null;
    let bookingUrl: string | null = null;
    let immediateRequested = false;

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
        else if (ag === "whatsapp") appointmentKind = "whatsapp";
        else if (ag === "imediato") { appointmentKind = "imediato"; immediateRequested = true; }

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

          // Se a captura pediu agendamento, gera um booking_link interno
          // (mesmo fluxo da Sofia/WhatsApp -> /agendar/:token -> booking-confirm)
          if (appointmentKind) {
            // Mapeia tipos da captura para o `kind` do CRM
            const kind = appointmentKind === "visita" ? "presencial"
              : appointmentKind === "videochamada" ? "videochamada"
              : "ligacao";

            // Evita duplicar: reaproveita link aberto recente da mesma sessão/lead
            const { data: existingLink } = await supabase
              .from("booking_links")
              .select("token, expires_at, used_at, kind")
              .eq("lead_id", leadId)
              .eq("kind", kind)
              .is("used_at", null)
              .gt("expires_at", new Date().toISOString())
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            let token = existingLink?.token as string | null;
            if (!token) {
              const arr = new Uint8Array(24);
              crypto.getRandomValues(arr);
              token = btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
              await supabase.from("booking_links").insert({
                token,
                lead_id: leadId,
                phone: fields.telefone || null,
                nome,
                kind,
              });
            }

            const baseUrl = Deno.env.get("PUBLIC_APP_URL") || "https://www.hrimoveis.com";
            bookingUrl = `${baseUrl.replace(/\/$/, "")}/agendar/${token}`;
          }
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
      booking_url: bookingUrl,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("public-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
