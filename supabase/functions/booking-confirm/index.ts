// Booking confirm — endpoint público chamado quando o lead confirma o slot.
// Cria a reunião, marca o token como usado e envia confirmação no WhatsApp.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function durationMin(kind: string): number {
  return kind === "ligacao" ? 30 : 60;
}

function tipoLabel(kind: string): string {
  return kind === "ligacao" ? "ligação" : kind === "videochamada" ? "videochamada" : "reunião presencial";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body.token || "");
    const datetimeIso = String(body.datetime_iso || "");
    if (!/^[a-zA-Z0-9_-]{16,64}$/.test(token)) {
      return new Response(JSON.stringify({ error: "token inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const dt = new Date(datetimeIso);
    if (isNaN(dt.getTime())) {
      return new Response(JSON.stringify({ error: "data inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (dt.getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "horário no passado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: link } = await supabase
      .from("booking_links")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (!link) {
      return new Response(JSON.stringify({ error: "link não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (link.used_at) {
      return new Response(JSON.stringify({ ok: true, already: true, reuniao_id: link.reuniao_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(link.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "link expirado", expired: true }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dur = durationMin(link.kind);
    const startIso = dt.toISOString();
    const endIso = new Date(dt.getTime() + dur * 60 * 1000).toISOString();

    // Confere conflito de última hora
    const [{ data: conflictReu }, { data: conflictBloq }] = await Promise.all([
      supabase.from("reunioes")
        .select("id, agendada_para, duracao_min, status")
        .gte("agendada_para", new Date(dt.getTime() - 60 * 60 * 1000).toISOString())
        .lte("agendada_para", endIso)
        .neq("status", "cancelada"),
      supabase.from("agenda_bloqueios")
        .select("id")
        .lte("inicio", endIso)
        .gte("fim", startIso),
    ]);
    const conflicts = (conflictReu ?? []).some((r: any) => {
      const s = new Date(r.agendada_para).getTime();
      const e = s + ((r.duracao_min as number) || 60) * 60 * 1000;
      return s < dt.getTime() + dur * 60 * 1000 && e > dt.getTime();
    });
    if (conflicts || (conflictBloq ?? []).length > 0) {
      return new Response(JSON.stringify({ error: "horário acabou de ser ocupado", conflict: true }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const titulo = `${tipoLabel(link.kind)} com ${link.nome || "lead WhatsApp"}`;

    // Busca corretor do lead (se houver) para preencher responsabilidade
    let corretorId: string | null = null;
    if (link.lead_id) {
      const { data: leadRow } = await supabase
        .from("leads")
        .select("corretor_id")
        .eq("id", link.lead_id)
        .maybeSingle();
      corretorId = leadRow?.corretor_id ?? null;
    }

    let createdId: string | null = null;

    if (link.kind === "ligacao") {
      // Vai para a aba Ligações (tabela `ligacoes`)
      const { data: lig, error: ligErr } = await supabase
        .from("ligacoes")
        .insert({
          lead_id: link.lead_id,
          data: startIso,
          duracao_seg: dur * 60,
          resultado: "agendada",
          notas: `Ligação agendada via WhatsApp/Sofia${link.nome ? ` com ${link.nome}` : ""}.`,
          corretor_id: corretorId,
        })
        .select("id")
        .single();
      if (ligErr || !lig) {
        console.error("erro criar ligacao", ligErr);
        return new Response(JSON.stringify({ error: "falha ao registrar ligação" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      createdId = lig.id;
    } else if (link.kind === "presencial" || link.kind === "videochamada") {
      // Vai para a aba Reuniões / Agenda
      const { data: reuniao, error: reErr } = await supabase
        .from("reunioes")
        .insert({
          agendada_para: startIso,
          duracao_min: dur,
          tipo: link.kind,
          titulo,
          status: "agendada",
          criado_por_ia: true,
          lead_id: link.lead_id,
          corretor_id: corretorId,
        })
        .select("id")
        .single();
      if (reErr || !reuniao) {
        console.error("erro criar reuniao", reErr);
        return new Response(JSON.stringify({ error: "falha ao criar reunião" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      createdId = reuniao.id;
    } else {
      // 'whatsapp' ou outro: registra apenas como interação no lead (sem reunião/ligação)
      const { error: intErr } = await supabase
        .from("interacoes")
        .insert({
          tipo: "whatsapp",
          lead_id: link.lead_id,
          agendado_para: startIso,
          descricao: `Contato por WhatsApp agendado via Sofia${link.nome ? ` com ${link.nome}` : ""}.`,
          created_by: corretorId,
        });
      if (intErr) console.error("erro criar interacao whatsapp", intErr);
    }

    await supabase.from("booking_links")
      .update({ used_at: new Date().toISOString(), reuniao_id: createdId })
      .eq("id", link.id);

    // Mensagem de volta no WhatsApp
    if (link.phone) {
      const dataBr = dt.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        weekday: "long", day: "2-digit", month: "long",
        hour: "2-digit", minute: "2-digit",
      });
      const msg = `✅ Anotado! Sua ${tipoLabel(link.kind)} com o Hans está marcada para ${dataBr}. Até lá!`;

      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            phone: link.phone,
            message: msg,
            conversation_id: link.conversation_id,
          }),
        });
      } catch (e) {
        console.error("falha envio WhatsApp confirmação", e);
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      reuniao_id: createdId,
      kind: link.kind,
      datetime_iso: startIso,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("booking-confirm error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
