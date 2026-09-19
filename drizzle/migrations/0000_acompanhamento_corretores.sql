CREATE TABLE IF NOT EXISTS public.conta_acompanhamento (
  conta_id uuid PRIMARY KEY REFERENCES public.contas(id) ON DELETE CASCADE,
  classificacao text NOT NULL,
  observacao text,
  autor_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conta_acompanhamento TO authenticated;
GRANT ALL ON public.conta_acompanhamento TO service_role;

ALTER TABLE public.conta_acompanhamento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff le acompanhamento" ON public.conta_acompanhamento;
CREATE POLICY "staff le acompanhamento" ON public.conta_acompanhamento
  FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "gestor escreve acompanhamento" ON public.conta_acompanhamento;
CREATE POLICY "gestor escreve acompanhamento" ON public.conta_acompanhamento
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'));

CREATE OR REPLACE FUNCTION public.acompanhamento_corretores(
  _inicio timestamptz,
  _fim timestamptz,
  _prazo_dias integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  WITH leads_periodo AS (
    SELECT * FROM leads WHERE created_at >= _inicio AND created_at <= _fim
  ),
  contas_periodo AS (
    SELECT * FROM contas WHERE created_at >= _inicio AND created_at <= _fim
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
  base AS (
    SELECT c.id, c.nome, c.responsavel_id, c.etapa_funil, c.motivo_cancelamento,
           coalesce(c.desclassificada,false) AS desclassificada,
           c.qualificacao_status, c.created_at,
           u.ultima, coalesce(u.qtd,0) AS qtd, t.prazo,
           GREATEST(0, (EXTRACT(EPOCH FROM (now() - coalesce(u.ultima, c.created_at))) / 86400)::int) AS dias_sem_contato,
           m.classificacao AS manual_cls, m.observacao AS manual_obs
    FROM contas_periodo c
    LEFT JOIN ult u ON u.conta_id = c.id
    LEFT JOIN prox t ON t.conta_id = c.id
    LEFT JOIN conta_acompanhamento m ON m.conta_id = c.id
  ),
  cls AS (
    SELECT b.*,
      coalesce(b.manual_cls,
        CASE
          WHEN b.etapa_funil = 'contato_cancelado' THEN
            CASE
              WHEN b.motivo_cancelamento ILIKE '%sem interesse%' THEN 'sem_interesse'
              WHEN b.motivo_cancelamento ILIKE '%duplicad%'
                OR b.motivo_cancelamento ILIKE '%inv_lido%'
                OR b.motivo_cancelamento ILIKE '%spam%'
                OR b.motivo_cancelamento ILIKE '%perfil%'
                OR b.motivo_cancelamento ILIKE '%regi_o%' THEN 'desqualificado'
              ELSE 'encerrado'
            END
          WHEN b.desclassificada THEN 'desqualificado'
          WHEN b.etapa_funil = 'sem_retorno' THEN 'sem_retorno'
          WHEN b.qualificacao_status IN ('oportunidade_ativa','oportunidade_futura') THEN 'virando_oportunidade'
          WHEN b.qtd = 0 AND coalesce(b.etapa_funil,'a_contatar') <> 'a_contatar' THEN 'crm_desatualizado'
          WHEN b.dias_sem_contato > _prazo_dias THEN 'falta_followup'
          ELSE 'ciclo_andamento'
        END) AS classificacao
    FROM base b
  ),
  cls_g AS (
    SELECT c.*,
      CASE
        WHEN c.classificacao IN ('falta_followup','crm_desatualizado') THEN 'falha_processo'
        WHEN c.classificacao IN ('virando_oportunidade','ciclo_andamento') THEN 'em_jogo'
        ELSE 'desfecho_cliente'
      END AS grupo,
      coalesce(p.nome,'Sem responsável') AS corretor_nome
    FROM cls c
    LEFT JOIN profiles p ON p.user_id = c.responsavel_id
  ),
  por_corretor AS (
    SELECT responsavel_id, corretor_nome,
      count(*)::int AS total,
      count(*) FILTER (WHERE grupo='falha_processo')::int AS falha_processo,
      count(*) FILTER (WHERE grupo='desfecho_cliente')::int AS desfecho_cliente,
      count(*) FILTER (WHERE grupo='em_jogo')::int AS em_jogo,
      count(*) FILTER (WHERE classificacao='falta_followup')::int AS falta_followup,
      count(*) FILTER (WHERE classificacao='crm_desatualizado')::int AS crm_desatualizado,
      count(*) FILTER (WHERE classificacao='sem_retorno')::int AS sem_retorno,
      count(*) FILTER (WHERE classificacao='sem_interesse')::int AS sem_interesse,
      count(*) FILTER (WHERE classificacao='desqualificado')::int AS desqualificado,
      count(*) FILTER (WHERE classificacao='encerrado')::int AS encerrado,
      count(*) FILTER (WHERE classificacao='virando_oportunidade')::int AS virando_oportunidade,
      count(*) FILTER (WHERE classificacao='ciclo_andamento')::int AS ciclo_andamento,
      round(avg(dias_sem_contato) FILTER (WHERE grupo='falha_processo'), 1) AS dias_medios_travadas
    FROM cls_g GROUP BY responsavel_id, corretor_nome
  )
  SELECT jsonb_build_object(
    'prazo_dias', _prazo_dias,
    'entrada', jsonb_build_object(
      'leads', (SELECT count(*) FROM leads_periodo),
      'desclassificados', (SELECT count(*) FROM leads_periodo WHERE motivo_desclassificacao IS NOT NULL),
      'perdidos_pos_triagem', (SELECT count(*) FROM leads_periodo WHERE etapa_funil = 'Perdido' AND motivo_desclassificacao IS NULL),
      'contas', (SELECT count(*) FROM contas_periodo),
      'oportunidades', (SELECT count(*) FROM oportunidades WHERE created_at >= _inicio AND created_at <= _fim),
      'origens', coalesce((SELECT jsonb_agg(x) FROM (
          SELECT coalesce(origem,'Não informada') AS origem, count(*)::int AS total
          FROM leads_periodo GROUP BY 1 ORDER BY 2 DESC
        ) x), '[]'::jsonb)
    ),
    'totais', jsonb_build_object(
      'contas', (SELECT count(*) FROM cls_g),
      'falha_processo', (SELECT count(*) FROM cls_g WHERE grupo='falha_processo'),
      'desfecho_cliente', (SELECT count(*) FROM cls_g WHERE grupo='desfecho_cliente'),
      'em_jogo', (SELECT count(*) FROM cls_g WHERE grupo='em_jogo'),
      'falta_followup', (SELECT count(*) FROM cls_g WHERE classificacao='falta_followup'),
      'dias_medios_travadas', (SELECT round(avg(dias_sem_contato),1) FROM cls_g WHERE grupo='falha_processo')
    ),
    'corretores', coalesce((SELECT jsonb_agg(to_jsonb(pc) ORDER BY pc.total DESC) FROM por_corretor pc), '[]'::jsonb),
    'contas_detalhe', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', g.id, 'nome', g.nome, 'corretor_nome', g.corretor_nome,
        'classificacao', g.classificacao, 'grupo', g.grupo,
        'observacao', g.manual_obs, 'manual', (g.manual_cls IS NOT NULL),
        'etapa_funil', g.etapa_funil, 'interacoes', g.qtd,
        'ultima_interacao', g.ultima, 'dias_sem_contato', g.dias_sem_contato,
        'proxima_tarefa', g.prazo, 'created_at', g.created_at
      ) ORDER BY g.corretor_nome, g.dias_sem_contato DESC) FROM cls_g g), '[]'::jsonb)
  ) INTO v;

  RETURN v;
END;
$$;

REVOKE ALL ON FUNCTION public.acompanhamento_corretores(timestamptz, timestamptz, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.acompanhamento_corretores(timestamptz, timestamptz, integer) TO authenticated;