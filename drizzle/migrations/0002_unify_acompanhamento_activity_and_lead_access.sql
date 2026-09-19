DROP FUNCTION IF EXISTS public.acompanhamento_corretores(timestamptz, timestamptz, integer);

CREATE OR REPLACE FUNCTION public.acompanhamento_corretores(
  _inicio timestamptz,
  _fim timestamptz,
  _prazo_dias integer DEFAULT 7,
  _origens_carteira text[] DEFAULT ARRAY['base_hr','marketing','carteira_propria']::text[]
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
  v_origens text[];
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  v_origens := coalesce(_origens_carteira, ARRAY['base_hr','marketing','carteira_propria']::text[]);
  IF cardinality(v_origens) = 0 OR EXISTS (
    SELECT 1 FROM unnest(v_origens) origem
    WHERE origem NOT IN ('base_hr','marketing','carteira_propria')
  ) THEN
    RAISE EXCEPTION 'Origem de carteira inválida';
  END IF;

  WITH primeira_atribuicao AS (
    SELECT DISTINCT ON (a.conta_id)
      a.conta_id,
      coalesce(a.responsavel_anterior_id, a.corretor_original_id) AS dono_original_id
    FROM carteira_atribuicoes a
    ORDER BY a.conta_id, a.atribuida_em ASC, a.created_at ASC
  ),
  contas_origem AS (
    SELECT c.*,
      CASE
        WHEN c.categoria = 'marketing' THEN 'marketing'
        WHEN EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = coalesce(pa.dono_original_id, c.created_by, c.responsavel_id)
            AND ur.role IN ('admin','gestor')
        ) AND NOT EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = coalesce(pa.dono_original_id, c.created_by, c.responsavel_id)
            AND ur.role = 'corretor'
        ) THEN 'base_hr'
        ELSE 'carteira_propria'
      END AS origem_carteira
    FROM contas c
    LEFT JOIN primeira_atribuicao pa ON pa.conta_id = c.id
  ),
  leads_classificados AS (
    SELECT l.*,
      coalesce(co.origem_carteira,
        CASE
          WHEN lower(coalesce(l.origem,'')) LIKE ANY (ARRAY['%meta%','%facebook%','%instagram%','%site%','%google%','%form%']) THEN 'marketing'
          WHEN EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = coalesce(l.corretor_id, l.created_by)
              AND ur.role IN ('admin','gestor')
          ) AND NOT EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = coalesce(l.corretor_id, l.created_by)
              AND ur.role = 'corretor'
          ) THEN 'base_hr'
          ELSE 'carteira_propria'
        END
      ) AS origem_carteira
    FROM leads l
    LEFT JOIN LATERAL (
      SELECT x.origem_carteira
      FROM contas_origem x
      WHERE x.lead_id_origem = l.id
      ORDER BY x.created_at ASC
      LIMIT 1
    ) co ON true
  ),
  leads_periodo AS (
    SELECT * FROM leads_classificados
    WHERE created_at >= _inicio AND created_at <= _fim
      AND origem_carteira = ANY(v_origens)
  ),
  contas_periodo AS (
    SELECT c.*
    FROM contas_origem c
    WHERE c.origem_carteira = ANY(v_origens)
      AND (
        c.created_at BETWEEN _inicio AND _fim
        OR c.updated_at BETWEEN _inicio AND _fim
        OR EXISTS (SELECT 1 FROM interacoes i WHERE i.conta_id=c.id AND i.created_at BETWEEN _inicio AND _fim)
        OR EXISTS (SELECT 1 FROM tarefas t WHERE t.conta_id=c.id AND (t.created_at BETWEEN _inicio AND _fim OR t.updated_at BETWEEN _inicio AND _fim OR t.prazo BETWEEN _inicio AND _fim))
        OR EXISTS (SELECT 1 FROM oportunidades o WHERE o.conta_id=c.id AND (o.created_at BETWEEN _inicio AND _fim OR o.updated_at BETWEEN _inicio AND _fim OR o.estagio_desde BETWEEN _inicio AND _fim OR o.encerrada_em BETWEEN _inicio AND _fim))
        OR EXISTS (SELECT 1 FROM carteira_eventos ce WHERE ce.conta_id=c.id AND ce.created_at BETWEEN _inicio AND _fim)
      )
  ),
  ult AS (
    SELECT conta_id, max(created_at) AS ultima, count(*)::int AS qtd
    FROM interacoes WHERE conta_id IS NOT NULL GROUP BY conta_id
  ),
  prox AS (
    SELECT conta_id, min(prazo) AS prazo FROM tarefas
    WHERE conta_id IS NOT NULL AND status <> 'Concluída' AND prazo >= now()
    GROUP BY conta_id
  ),
  oportunidade_conta AS (
    SELECT o.conta_id,
      count(*)::int AS qtd_oportunidades,
      count(*) FILTER (WHERE o.estagio NOT IN ('ganha','perdida'))::int AS qtd_ativas
    FROM oportunidades o
    WHERE o.conta_id IS NOT NULL
    GROUP BY o.conta_id
  ),
  base AS (
    SELECT c.id, c.nome, c.responsavel_id, c.etapa_funil, c.motivo_cancelamento,
      c.origem_carteira, coalesce(c.desclassificada,false) AS desclassificada,
      c.qualificacao_status, c.created_at, u.ultima, coalesce(u.qtd,0) AS qtd,
      t.prazo, coalesce(oc.qtd_oportunidades,0) AS qtd_oportunidades,
      coalesce(oc.qtd_ativas,0) AS qtd_oportunidades_ativas,
      GREATEST(0, (EXTRACT(EPOCH FROM (now() - coalesce(u.ultima, c.created_at))) / 86400)::int) AS dias_sem_contato,
      m.classificacao AS manual_cls, m.observacao AS manual_obs
    FROM contas_periodo c
    LEFT JOIN ult u ON u.conta_id=c.id
    LEFT JOIN prox t ON t.conta_id=c.id
    LEFT JOIN oportunidade_conta oc ON oc.conta_id=c.id
    LEFT JOIN conta_acompanhamento m ON m.conta_id=c.id
  ),
  cls AS (
    SELECT b.*,
      coalesce(b.manual_cls,
        CASE
          WHEN b.etapa_funil IN ('captacao_imovel','reuniao','visita','permuta','proposta','fechado','perdido','parceiros') THEN 'etapa_antiga'
          WHEN b.etapa_funil='contato_cancelado' THEN
            CASE
              WHEN b.motivo_cancelamento ILIKE '%sem interesse%' THEN 'sem_interesse'
              WHEN b.motivo_cancelamento ILIKE '%duplicad%' OR b.motivo_cancelamento ILIKE '%inv_lido%'
                OR b.motivo_cancelamento ILIKE '%spam%' OR b.motivo_cancelamento ILIKE '%perfil%'
                OR b.motivo_cancelamento ILIKE '%regi_o%' THEN 'desqualificado'
              ELSE 'encerrado'
            END
          WHEN b.desclassificada THEN 'desqualificado'
          WHEN b.etapa_funil='sem_retorno' THEN 'sem_retorno'
          WHEN b.qtd_oportunidades > 0 THEN 'virando_oportunidade'
          WHEN b.qualificacao_status='oportunidade_futura' THEN 'oportunidade_futura'
          WHEN b.qtd=0 AND coalesce(b.etapa_funil,'a_contatar') <> 'a_contatar' THEN 'crm_desatualizado'
          WHEN b.dias_sem_contato > _prazo_dias THEN 'falta_followup'
          ELSE 'ciclo_andamento'
        END) AS classificacao
    FROM base b
  ),
  cls_g AS (
    SELECT c.*,
      CASE
        WHEN c.classificacao IN ('falta_followup','crm_desatualizado') THEN 'falha_processo'
        WHEN c.classificacao IN ('virando_oportunidade','oportunidade_futura','ciclo_andamento') THEN 'em_jogo'
        WHEN c.classificacao='etapa_antiga' THEN 'revisao'
        ELSE 'desfecho_cliente'
      END AS grupo,
      coalesce(p.nome,'Sem responsável válido') AS corretor_nome,
      EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id=c.responsavel_id AND ur.role IN ('corretor','admin','gestor')
      ) AS responsavel_valido
    FROM cls c
    LEFT JOIN profiles p ON p.user_id=c.responsavel_id
  ),
  oportunidades_periodo AS (
    SELECT o.*, c.nome AS conta_nome, c.responsavel_id AS conta_responsavel_id,
      coalesce(pc.nome,'Sem responsável válido') AS conta_responsavel_nome,
      coalesce(po.nome,'Sem corretor válido') AS oportunidade_corretor_nome,
      c.origem_carteira
    FROM oportunidades o
    JOIN contas_origem c ON c.id=o.conta_id
    LEFT JOIN profiles pc ON pc.user_id=c.responsavel_id
    LEFT JOIN profiles po ON po.user_id=o.corretor_id
    WHERE c.origem_carteira=ANY(v_origens)
      AND (o.created_at BETWEEN _inicio AND _fim OR o.updated_at BETWEEN _inicio AND _fim OR o.estagio_desde BETWEEN _inicio AND _fim OR o.encerrada_em BETWEEN _inicio AND _fim)
  ),
  por_corretor AS (
    SELECT responsavel_id, corretor_nome,
      count(*)::int AS total,
      count(*) FILTER (WHERE grupo='falha_processo')::int AS falha_processo,
      count(*) FILTER (WHERE grupo='desfecho_cliente')::int AS desfecho_cliente,
      count(*) FILTER (WHERE grupo='em_jogo')::int AS em_jogo,
      count(*) FILTER (WHERE grupo='revisao')::int AS revisao,
      count(*) FILTER (WHERE classificacao='falta_followup')::int AS falta_followup,
      count(*) FILTER (WHERE classificacao='crm_desatualizado')::int AS crm_desatualizado,
      count(*) FILTER (WHERE classificacao='sem_retorno')::int AS sem_retorno,
      count(*) FILTER (WHERE classificacao='sem_interesse')::int AS sem_interesse,
      count(*) FILTER (WHERE classificacao='desqualificado')::int AS desqualificado,
      count(*) FILTER (WHERE classificacao='encerrado')::int AS encerrado,
      count(*) FILTER (WHERE classificacao='virando_oportunidade')::int AS virando_oportunidade,
      count(*) FILTER (WHERE classificacao='oportunidade_futura')::int AS oportunidade_futura,
      count(*) FILTER (WHERE classificacao='etapa_antiga')::int AS etapa_antiga,
      count(*) FILTER (WHERE classificacao='ciclo_andamento')::int AS ciclo_andamento,
      round(avg(dias_sem_contato) FILTER (WHERE grupo='falha_processo'),1) AS dias_medios_travadas,
      (SELECT count(*)::int FROM oportunidades_periodo op WHERE op.corretor_id IS NOT DISTINCT FROM g.responsavel_id) AS oportunidades_conduzidas
    FROM cls_g g
    GROUP BY responsavel_id, corretor_nome
  ),
  operacao AS (
    SELECT
      (SELECT count(DISTINCT i.conta_id) FROM interacoes i JOIN contas_origem c ON c.id=i.conta_id WHERE c.origem_carteira=ANY(v_origens) AND i.created_at BETWEEN _inicio AND _fim) AS contas_com_interacao,
      (SELECT count(*) FROM interacoes i JOIN contas_origem c ON c.id=i.conta_id WHERE c.origem_carteira=ANY(v_origens) AND i.created_at BETWEEN _inicio AND _fim) AS interacoes,
      (SELECT count(*) FROM tarefas t JOIN contas_origem c ON c.id=t.conta_id WHERE c.origem_carteira=ANY(v_origens) AND (t.created_at BETWEEN _inicio AND _fim OR t.updated_at BETWEEN _inicio AND _fim OR t.prazo BETWEEN _inicio AND _fim)) AS tarefas,
      (SELECT count(*) FROM carteira_eventos ce JOIN contas_origem c ON c.id=ce.conta_id WHERE c.origem_carteira=ANY(v_origens) AND ce.created_at BETWEEN _inicio AND _fim) AS movimentacoes,
      (SELECT count(*) FROM oportunidades_periodo) AS oportunidades_conduzidas
  )
  SELECT jsonb_build_object(
    'prazo_dias',_prazo_dias,
    'entrada',jsonb_build_object(
      'leads',(SELECT count(*) FROM leads_periodo),
      'desclassificados',(SELECT count(*) FROM leads_periodo WHERE motivo_desclassificacao IS NOT NULL),
      'leads_com_conta',(SELECT count(DISTINCT lp.id) FROM leads_periodo lp JOIN contas_origem c ON c.lead_id_origem=lp.id),
      'leads_com_oportunidade',(SELECT count(DISTINCT lp.id) FROM leads_periodo lp JOIN oportunidades o ON o.lead_id_origem=lp.id OR EXISTS (SELECT 1 FROM contas c WHERE c.id=o.conta_id AND c.lead_id_origem=lp.id)),
      'leads_sem_vinculo',(SELECT count(*) FROM leads_periodo lp WHERE NOT EXISTS (SELECT 1 FROM contas c WHERE c.lead_id_origem=lp.id)),
      'contas_trabalhadas',(SELECT count(*) FROM contas_periodo),
      'oportunidades_conduzidas',(SELECT count(*) FROM oportunidades_periodo),
      'origens',coalesce((SELECT jsonb_agg(x ORDER BY x.total DESC) FROM (SELECT CASE origem_carteira WHEN 'base_hr' THEN 'Base HR Imóveis' WHEN 'marketing' THEN 'Marketing' ELSE 'Carteira própria do corretor' END origem,count(*)::int total FROM leads_periodo GROUP BY origem_carteira)x),'[]'::jsonb)
    ),
    'totais',jsonb_build_object(
      'contas',(SELECT count(*) FROM cls_g),
      'falha_processo',(SELECT count(*) FROM cls_g WHERE grupo='falha_processo'),
      'desfecho_cliente',(SELECT count(*) FROM cls_g WHERE grupo='desfecho_cliente'),
      'em_jogo',(SELECT count(*) FROM cls_g WHERE grupo='em_jogo'),
      'revisao',(SELECT count(*) FROM cls_g WHERE grupo='revisao'),
      'falta_followup',(SELECT count(*) FROM cls_g WHERE classificacao='falta_followup'),
      'oportunidade_futura',(SELECT count(*) FROM cls_g WHERE classificacao='oportunidade_futura'),
      'etapa_antiga',(SELECT count(*) FROM cls_g WHERE classificacao='etapa_antiga'),
      'sem_responsavel_valido',(SELECT count(*) FROM cls_g WHERE NOT responsavel_valido),
      'dias_medios_travadas',(SELECT round(avg(dias_sem_contato),1) FROM cls_g WHERE grupo='falha_processo')
    ),
    'operacao',(SELECT to_jsonb(o) FROM operacao o),
    'corretores',coalesce((SELECT jsonb_agg(to_jsonb(pc) ORDER BY pc.total DESC) FROM por_corretor pc),'[]'::jsonb),
    'divergencias',coalesce((SELECT jsonb_agg(jsonb_build_object('oportunidade_id',op.id,'conta_id',op.conta_id,'cliente',op.conta_nome,'responsavel_conta',op.conta_responsavel_nome,'corretor_oportunidade',op.oportunidade_corretor_nome,'estagio',op.estagio,'ativa',op.estagio NOT IN ('ganha','perdida')) ORDER BY op.conta_nome) FROM oportunidades_periodo op WHERE op.corretor_id IS DISTINCT FROM op.conta_responsavel_id),'[]'::jsonb),
    'contas_detalhe',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id',g.id,'nome',g.nome,'corretor_nome',g.corretor_nome,'classificacao',g.classificacao,'grupo',g.grupo,
      'observacao',g.manual_obs,'manual',(g.manual_cls IS NOT NULL),'etapa_funil',g.etapa_funil,'interacoes',g.qtd,
      'ultima_interacao',g.ultima,'dias_sem_contato',g.dias_sem_contato,'proxima_tarefa',g.prazo,'created_at',g.created_at,
      'origem_carteira',g.origem_carteira,'qtd_oportunidades',g.qtd_oportunidades,'qtd_oportunidades_ativas',g.qtd_oportunidades_ativas
    ) ORDER BY g.corretor_nome,g.dias_sem_contato DESC) FROM cls_g g),'[]'::jsonb)
  ) INTO v;
  RETURN v;
END;
$$;

REVOKE ALL ON FUNCTION public.acompanhamento_corretores(timestamptz,timestamptz,integer,text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.acompanhamento_corretores(timestamptz,timestamptz,integer,text[]) TO authenticated;

DROP POLICY IF EXISTS "Corretor sees own leads" ON public.leads;
DROP POLICY IF EXISTS "Corretor updates own leads" ON public.leads;
DROP POLICY IF EXISTS "Admin/gestor see all leads" ON public.leads;
DROP POLICY IF EXISTS "Admin/gestor update any lead" ON public.leads;
DROP POLICY IF EXISTS "Staff can create leads" ON public.leads;

CREATE POLICY "Admin gestor marketing see leads"
ON public.leads FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'marketing'));

CREATE POLICY "Admin gestor marketing update leads"
ON public.leads FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'marketing'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'marketing'));

CREATE POLICY "Admin gestor marketing create leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (auth.uid()=created_by AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'marketing')));