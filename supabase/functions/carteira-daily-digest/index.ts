// Rotina diária da Distribuição de Carteira:
// 1) executa carteira_rotina_diaria() (atrasos, devolução automática, alertas)
// 2) envia resumo por e-mail para corretores com pendências e para gestores/admin
// Acionada por pg_cron (madrugada, horário de Cuiabá).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data: rotina, error: rotinaErr } = await supabase.rpc("carteira_rotina_diaria");
    if (rotinaErr) {
      console.error("carteira_rotina_diaria falhou:", rotinaErr.message);
      return json({ error: rotinaErr.message }, 500);
    }

    const { data: cfg } = await supabase
      .from("carteira_config")
      .select("emails_resumo")
      .eq("id", true)
      .maybeSingle();

    if (!cfg?.emails_resumo) {
      return json({ ok: true, rotina, emails: 0, motivo: "resumos desativados" });
    }

    const baseUrl = (Deno.env.get("PUBLIC_APP_URL") || "https://royal-dashboard.lovable.app").replace(/\/$/, "");
    const hoje = new Date().toISOString().slice(0, 10);

    const { data: ativas } = await supabase
      .from("carteira_atribuicoes")
      .select("id, conta_id, corretor_id, tentativas, prazo_primeiro_contato, proxima_acao, proxima_acao_em, contato_estabelecido_em, solicitacao_tipo")
      .is("encerrada_em", null);

    const rows = (ativas ?? []) as any[];
    const contaIds = [...new Set(rows.map((r) => r.conta_id))];
    const nomePorConta = new Map<string, string>();
    for (let i = 0; i < contaIds.length; i += 200) {
      const { data: contas } = await supabase
        .from("contas")
        .select("id, nome")
        .in("id", contaIds.slice(i, i + 200));
      (contas ?? []).forEach((c: any) => nomePorConta.set(c.id, c.nome));
    }

    const agora = Date.now();
    const porCorretor = new Map<string, { atrasadas: any[]; vencidas: any[]; ativas: number; solicitacoes: number }>();
    for (const r of rows) {
      if (!r.corretor_id) continue;
      const e = porCorretor.get(r.corretor_id) ?? { atrasadas: [], vencidas: [], ativas: 0, solicitacoes: 0 };
      e.ativas += 1;
      if (r.solicitacao_tipo) e.solicitacoes += 1;
      if (r.tentativas === 0 && r.prazo_primeiro_contato && Date.parse(r.prazo_primeiro_contato) < agora) e.atrasadas.push(r);
      if (r.proxima_acao_em && Date.parse(r.proxima_acao_em) < agora) e.vencidas.push(r);
      porCorretor.set(r.corretor_id, e);
    }

    const { data: perfis } = await supabase.from("profiles").select("user_id, nome, email");
    const perfilPor = new Map<string, any>((perfis ?? []).map((p: any) => [p.user_id, p]));

    let enviados = 0;

    for (const [corretorId, e] of porCorretor) {
      if (e.atrasadas.length === 0 && e.vencidas.length === 0) continue;
      const p = perfilPor.get(corretorId);
      if (!p?.email) continue;

      const destaques = [
        ...e.atrasadas.slice(0, 5).map((a) => `${nomePorConta.get(a.conta_id) ?? "Conta"} — primeiro contato vencido`),
        ...e.vencidas.slice(0, 5).map((a) => `${nomePorConta.get(a.conta_id) ?? "Conta"} — ${a.proxima_acao || "ação agendada"} vencida`),
      ];

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "carteira-resumo-diario",
          recipientEmail: p.email,
          idempotencyKey: `carteira-digest-${hoje}-${corretorId}`,
          purpose: "transactional",
          templateData: {
            nome: p.nome || undefined,
            papel: "corretor",
            resumo: [
              { label: "Contas ativas na carteira", value: String(e.ativas) },
              { label: "Primeiro contato atrasado", value: String(e.atrasadas.length) },
              { label: "Ações agendadas vencidas", value: String(e.vencidas.length) },
            ],
            destaques,
            url: `${baseUrl}/crm/minha-carteira`,
          },
        },
      });
      if (error) console.error("Falha ao enviar resumo do corretor:", corretorId, error.message);
      else enviados += 1;
    }

    // Resumo dos gestores/admin
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "gestor"]);

    const gestores = [...new Set((adminRoles ?? []).map((r: any) => r.user_id))];
    if (gestores.length > 0) {
      const totalAtrasadas = [...porCorretor.values()].reduce((s, e) => s + e.atrasadas.length, 0);
      const totalVencidas = [...porCorretor.values()].reduce((s, e) => s + e.vencidas.length, 0);
      const totalSolicitacoes = [...porCorretor.values()].reduce((s, e) => s + e.solicitacoes, 0);
      const devolucoesAuto = (rotina as any)?.devolvidas ?? 0;

      if (totalAtrasadas > 0 || totalSolicitacoes > 0 || devolucoesAuto > 0) {
        const destaques = [...porCorretor.entries()]
          .filter(([, e]) => e.atrasadas.length > 0)
          .sort((a, b) => b[1].atrasadas.length - a[1].atrasadas.length)
          .slice(0, 8)
          .map(([id, e]) => {
            const p = perfilPor.get(id);
            return `${p?.nome || p?.email || "Corretor"} — ${e.atrasadas.length} atrasada(s), ${e.vencidas.length} ação(ões) vencida(s)`;
          });

        for (const gid of gestores) {
          const p = perfilPor.get(gid);
          if (!p?.email) continue;
          const { error } = await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "carteira-resumo-diario",
              recipientEmail: p.email,
              idempotencyKey: `carteira-digest-gestor-${hoje}-${gid}`,
              purpose: "transactional",
              templateData: {
                nome: p.nome || undefined,
                papel: "gestor",
                resumo: [
                  { label: "Contas atrasadas", value: String(totalAtrasadas) },
                  { label: "Ações vencidas", value: String(totalVencidas) },
                  { label: "Solicitações pendentes", value: String(totalSolicitacoes) },
                  { label: "Devoluções automáticas hoje", value: String(devolucoesAuto) },
                ],
                destaques,
                url: `${baseUrl}/crm/carteira`,
              },
            },
          });
          if (error) console.error("Falha ao enviar resumo do gestor:", gid, error.message);
          else enviados += 1;
        }
      }
    }

    return json({ ok: true, rotina, emails: enviados });
  } catch (e) {
    console.error("carteira-daily-digest erro:", e);
    return json({ error: String(e) }, 500);
  }
});
