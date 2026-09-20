CREATE INDEX IF NOT EXISTS acompanhamento_diario_dia_origem_idx
ON public.acompanhamento_conta_diario (dia, origem_carteira);

CREATE INDEX IF NOT EXISTS carteira_atribuicoes_conta_data_idx
ON public.carteira_atribuicoes (conta_id, atribuida_em DESC);

CREATE INDEX IF NOT EXISTS tarefas_conta_prazo_status_idx
ON public.tarefas (conta_id, prazo)
WHERE status IS DISTINCT FROM 'Concluída';

CREATE OR REPLACE FUNCTION public.acompanhamento_apurar_diario(
  _inicio timestamptz,
  _fim timestamptz,
  _prazo_dias integer DEFAULT 7,
  _origens_carteira text[] DEFAULT ARRAY['base_hr','marketing','carteira_propria']::text[]
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout TO '25s'
AS $$
DECLARE
  v_inicio date := (_inicio AT TIME ZONE 'America/Cuiaba')::date;
  v_fim date := least((_fim AT TIME ZONE 'America/Cuiaba')::date, (now() AT TIME ZONE 'America/Cuiaba')::date);
  v_hoje date := (now() AT TIME ZONE 'America/Cuiaba')::date;
  v_origens text[] := coalesce(_origens_carteira, ARRAY['base_hr','marketing','carteira_propria']::text[]);
  v_resultado jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')) THEN
    RAISE EXCEPTION 'Acesso restrito';
  END IF;
  IF _inicio IS NULL OR _fim IS NULL OR v_fim < v_inicio THEN RAISE EXCEPTION 'Período inválido'; END IF;
  IF _prazo_dias < 1 OR _prazo_dias > 365 THEN RAISE EXCEPTION 'Prazo inválido'; END IF;
  IF cardinality(v_origens)=0 OR EXISTS (SELECT 1 FROM unnest(v_origens) x WHERE x NOT IN ('base_hr','marketing','carteira_propria')) THEN
    RAISE EXCEPTION 'Origem de carteira inválida';
  END IF;

  IF v_hoje BETWEEN v_inicio AND v_fim AND extract(isodow FROM v_hoje) BETWEEN 1 AND 5 THEN
    WITH primeira_atribuicao AS (
      SELECT DISTINCT ON (a.conta_id) a.conta_id, a.atribuida_em,
        coalesce(a.responsavel_anterior_id,a.corretor_original_id) dono_original_id
      FROM public.carteira_atribuicoes a
      ORDER BY a.conta_id,a.atribuida_em,a.created_at
    ), hoje AS (
      SELECT v_hoje dia,c.id conta_id,c.responsavel_id,
        CASE WHEN c.categoria='marketing' THEN 'marketing'
          WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=coalesce(pa.dono_original_id,c.created_by,c.responsavel_id) AND ur.role IN ('admin','gestor'))
           AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=coalesce(pa.dono_original_id,c.created_by,c.responsavel_id) AND ur.role='corretor') THEN 'base_hr'
          ELSE 'carteira_propria' END origem_carteira,
        NOT coalesce(c.desclassificada,false) AND c.cancelado_em IS NULL ativa,
        EXISTS (SELECT 1 FROM public.interacoes i WHERE i.conta_id=c.id AND (i.created_at AT TIME ZONE 'America/Cuiaba')::date=v_hoje) interacao_no_dia,
        (SELECT max(i.created_at) FROM public.interacoes i WHERE i.conta_id=c.id AND (i.created_at AT TIME ZONE 'America/Cuiaba')::date<=v_hoje) ultima_interacao_em,
        EXISTS (SELECT 1 FROM public.tarefas t WHERE t.conta_id=c.id AND t.status IS DISTINCT FROM 'Concluída' AND (t.prazo AT TIME ZONE 'America/Cuiaba')::date<=v_hoje) tarefa_vencida,
        coalesce(c.proxima_acao_em,(SELECT min(t.prazo) FROM public.tarefas t WHERE t.conta_id=c.id AND t.status IS DISTINCT FROM 'Concluída' AND (t.prazo AT TIME ZONE 'America/Cuiaba')::date>=v_hoje)) proxima_acao_em,
        m.classificacao classificacao_base,(m.classificacao IS NOT NULL) classificacao_manual
      FROM public.contas c
      LEFT JOIN primeira_atribuicao pa ON pa.conta_id=c.id
      LEFT JOIN public.conta_acompanhamento m ON m.conta_id=c.id
      WHERE (c.created_at AT TIME ZONE 'America/Cuiaba')::date<=v_hoje
    )
    INSERT INTO public.acompanhamento_conta_diario (
      dia,conta_id,responsavel_id,origem_carteira,ativa,interacao_no_dia,ultima_interacao_em,
      tarefa_vencida,proxima_acao_em,classificacao_base,classificacao_manual,historico_determinavel,apurado_em
    )
    SELECT dia,conta_id,responsavel_id,origem_carteira,ativa,interacao_no_dia,ultima_interacao_em,
      tarefa_vencida,proxima_acao_em,classificacao_base,classificacao_manual,true,now()
    FROM hoje
    ON CONFLICT (dia,conta_id) DO UPDATE SET
      responsavel_id=excluded.responsavel_id,origem_carteira=excluded.origem_carteira,ativa=excluded.ativa,
      interacao_no_dia=excluded.interacao_no_dia,ultima_interacao_em=excluded.ultima_interacao_em,
      tarefa_vencida=excluded.tarefa_vencida,proxima_acao_em=excluded.proxima_acao_em,
      classificacao_base=excluded.classificacao_base,classificacao_manual=excluded.classificacao_manual,
      historico_determinavel=true,apurado_em=now();
  END IF;

  WITH dias AS MATERIALIZED (
    SELECT d::date dia
    FROM generate_series(v_inicio, v_fim, interval '1 day') d
    WHERE extract(isodow FROM d) BETWEEN 1 AND 5
  ),
  primeira_atribuicao AS MATERIALIZED (
    SELECT DISTINCT ON (a.conta_id) a.conta_id,a.atribuida_em,
      coalesce(a.responsavel_anterior_id,a.corretor_original_id) dono_original_id
    FROM public.carteira_atribuicoes a
    ORDER BY a.conta_id,a.atribuida_em,a.created_at
  ),
  contas_base AS MATERIALIZED (
    SELECT c.*,pa.atribuida_em primeira_atribuicao_em,pa.dono_original_id,
      CASE WHEN c.categoria='marketing' THEN 'marketing'
        WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=coalesce(pa.dono_original_id,c.created_by,c.responsavel_id) AND ur.role IN ('admin','gestor'))
         AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=coalesce(pa.dono_original_id,c.created_by,c.responsavel_id) AND ur.role='corretor') THEN 'base_hr'
        ELSE 'carteira_propria' END origem_calculada
    FROM public.contas c LEFT JOIN primeira_atribuicao pa ON pa.conta_id=c.id
    WHERE (c.created_at AT TIME ZONE 'America/Cuiaba')::date<=v_fim
  ),
  interacoes_dia AS MATERIALIZED (
    SELECT i.conta_id,(i.created_at AT TIME ZONE 'America/Cuiaba')::date dia,max(i.created_at) ultima_no_dia
    FROM public.interacoes i
    WHERE i.conta_id IS NOT NULL
      AND i.created_at < ((v_fim + 1)::timestamp AT TIME ZONE 'America/Cuiaba')
    GROUP BY i.conta_id,(i.created_at AT TIME ZONE 'America/Cuiaba')::date
  ),
  grade AS MATERIALIZED (
    SELECT d.dia,c.id conta_id,c.origem_calculada origem_carteira,
      coalesce(
        (SELECT a.corretor_id FROM public.carteira_atribuicoes a
         WHERE a.conta_id=c.id AND (a.atribuida_em AT TIME ZONE 'America/Cuiaba')::date<=d.dia
         ORDER BY a.atribuida_em DESC,a.created_at DESC LIMIT 1),
        CASE WHEN c.primeira_atribuicao_em IS NOT NULL AND (c.primeira_atribuicao_em AT TIME ZONE 'America/Cuiaba')::date>d.dia
          THEN coalesce(c.dono_original_id,c.created_by,c.responsavel_id) ELSE c.responsavel_id END
      ) responsavel_conta_id,
      NOT (coalesce(c.desclassificada,false) AND coalesce((c.qualificacao_em AT TIME ZONE 'America/Cuiaba')::date,(c.updated_at AT TIME ZONE 'America/Cuiaba')::date)<d.dia)
        AND NOT (c.cancelado_em IS NOT NULL AND (c.cancelado_em AT TIME ZONE 'America/Cuiaba')::date<d.dia) ativa,
      (idc.ultima_no_dia IS NOT NULL) interacao_no_dia,
      (SELECT max(idp.ultima_no_dia) FROM interacoes_dia idp WHERE idp.conta_id=c.id AND idp.dia<=d.dia) ultima_interacao_em,
      EXISTS (SELECT 1 FROM public.tarefas t WHERE t.conta_id=c.id AND t.status IS DISTINCT FROM 'Concluída' AND (t.prazo AT TIME ZONE 'America/Cuiaba')::date<=d.dia) tarefa_vencida,
      coalesce(c.proxima_acao_em,(SELECT min(t.prazo) FROM public.tarefas t WHERE t.conta_id=c.id AND t.status IS DISTINCT FROM 'Concluída' AND (t.prazo AT TIME ZONE 'America/Cuiaba')::date>=d.dia)) proxima_acao_em,
      CASE
        WHEN m.classificacao IS NOT NULL AND (m.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia THEN m.classificacao
        WHEN op.conta_id IS NOT NULL THEN 'virando_oportunidade'
        WHEN (c.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia AND c.etapa_funil IN ('perdido','oportunidade_futura') THEN CASE WHEN c.etapa_funil='perdido' THEN 'etapa_antiga' ELSE 'oportunidade_futura' END
        WHEN (c.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia AND (c.motivo_desclassificacao IS NOT NULL OR c.qualificacao_status='desqualificado') THEN 'desqualificado'
        WHEN (c.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia AND c.qualificacao_status IN ('sem_interesse','sem_retorno','encerrado') THEN c.qualificacao_status
        ELSE NULL END classificacao_base,
      coalesce(op.corretor_id,
        coalesce((SELECT a.corretor_id FROM public.carteira_atribuicoes a WHERE a.conta_id=c.id AND (a.atribuida_em AT TIME ZONE 'America/Cuiaba')::date<=d.dia ORDER BY a.atribuida_em DESC,a.created_at DESC LIMIT 1),
          CASE WHEN c.primeira_atribuicao_em IS NOT NULL AND (c.primeira_atribuicao_em AT TIME ZONE 'America/Cuiaba')::date>d.dia THEN coalesce(c.dono_original_id,c.created_by,c.responsavel_id) ELSE c.responsavel_id END)) responsavel_metrica_id,
      CASE WHEN d.dia=v_hoje THEN true
        WHEN m.classificacao IS NOT NULL AND (m.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia THEN true
        WHEN op.conta_id IS NOT NULL THEN true
        WHEN c.updated_at IS NULL OR (c.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia THEN true
        ELSE false END historico_determinavel
    FROM dias d
    JOIN contas_base c ON (c.created_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia AND c.origem_calculada=ANY(v_origens)
    LEFT JOIN interacoes_dia idc ON idc.conta_id=c.id AND idc.dia=d.dia
    LEFT JOIN public.conta_acompanhamento m ON m.conta_id=c.id
    LEFT JOIN LATERAL (
      SELECT o.conta_id,o.corretor_id
      FROM public.oportunidades o
      WHERE o.conta_id=c.id AND (o.created_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia
      ORDER BY o.created_at DESC LIMIT 1
    ) op ON true
  ),
  aval AS MATERIALIZED (
    SELECT g.*,
      CASE WHEN g.ultima_interacao_em IS NULL THEN 999999 ELSE greatest(0,g.dia-(g.ultima_interacao_em AT TIME ZONE 'America/Cuiaba')::date)::int END dias_sem_contato,
      (g.ativa AND (g.tarefa_vencida OR g.ultima_interacao_em IS NULL
        OR g.dia-(g.ultima_interacao_em AT TIME ZONE 'America/Cuiaba')::date>=_prazo_dias
        OR (g.proxima_acao_em IS NOT NULL AND (g.proxima_acao_em AT TIME ZONE 'America/Cuiaba')::date<=g.dia))) exigivel
    FROM grade g
  ),
  cls AS MATERIALIZED (
    SELECT a.*,
      CASE WHEN a.classificacao_base IS NOT NULL THEN a.classificacao_base
        WHEN a.exigivel AND NOT a.interacao_no_dia AND (a.ultima_interacao_em IS NULL OR a.dias_sem_contato>=_prazo_dias)
          THEN CASE WHEN a.ultima_interacao_em IS NULL THEN 'crm_desatualizado' ELSE 'falta_followup' END
        ELSE 'ciclo_andamento' END classificacao,
      CASE WHEN a.exigivel THEN (a.interacao_no_dia OR (NOT a.tarefa_vencida AND a.ultima_interacao_em IS NOT NULL AND a.dias_sem_contato<_prazo_dias)) ELSE NULL END crm_atualizado
    FROM aval a
  ),
  elegiveis AS MATERIALIZED (
    SELECT c.*,coalesce(p.nome,'Sem responsável válido') corretor_nome
    FROM cls c
    LEFT JOIN public.profiles p ON p.user_id=c.responsavel_metrica_id
    WHERE c.exigivel AND c.historico_determinavel
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=c.responsavel_metrica_id AND ur.role IN ('corretor','admin','gestor'))
  ),
  por_corretor AS (
    SELECT responsavel_metrica_id responsavel_id,corretor_nome,count(*)::int conta_dias_exigiveis,count(DISTINCT conta_id)::int contas_exigiveis,
      count(*) FILTER (WHERE crm_atualizado)::int crm_atualizado,count(*) FILTER (WHERE NOT crm_atualizado)::int crm_desatualizado,
      count(*) FILTER (WHERE classificacao='falta_followup')::int falta_followup,count(*) FILTER (WHERE classificacao='sem_retorno')::int sem_retorno,
      count(*) FILTER (WHERE classificacao='sem_interesse')::int sem_interesse,count(*) FILTER (WHERE classificacao='desqualificado')::int desqualificado,
      count(*) FILTER (WHERE classificacao='encerrado')::int encerrado,count(*) FILTER (WHERE classificacao='virando_oportunidade')::int virando_oportunidade,
      count(*) FILTER (WHERE classificacao='oportunidade_futura')::int oportunidade_futura,count(*) FILTER (WHERE classificacao='etapa_antiga')::int etapa_antiga,
      count(*) FILTER (WHERE classificacao='ciclo_andamento')::int ciclo_andamento,0::int historico_nao_determinavel
    FROM elegiveis GROUP BY responsavel_metrica_id,corretor_nome
  ),
  serie AS (
    SELECT dia,responsavel_metrica_id responsavel_id,corretor_nome,count(*)::int conta_dias_exigiveis,
      count(*) FILTER (WHERE crm_atualizado)::int crm_atualizado,count(*) FILTER (WHERE NOT crm_atualizado)::int crm_desatualizado,
      count(*) FILTER (WHERE classificacao='falta_followup')::int falta_followup,count(*) FILTER (WHERE classificacao='sem_retorno')::int sem_retorno,
      count(*) FILTER (WHERE classificacao='sem_interesse')::int sem_interesse,count(*) FILTER (WHERE classificacao='desqualificado')::int desqualificado,
      count(*) FILTER (WHERE classificacao='encerrado')::int encerrado,count(*) FILTER (WHERE classificacao='virando_oportunidade')::int virando_oportunidade,
      count(*) FILTER (WHERE classificacao='oportunidade_futura')::int oportunidade_futura,count(*) FILTER (WHERE classificacao='etapa_antiga')::int etapa_antiga,
      count(*) FILTER (WHERE classificacao='ciclo_andamento')::int ciclo_andamento
    FROM elegiveis GROUP BY dia,responsavel_metrica_id,corretor_nome
  )
  SELECT jsonb_build_object(
    'dias_uteis',(SELECT count(*) FROM dias),
    'conta_dias_exigiveis',(SELECT count(*) FROM elegiveis),
    'historico_nao_determinavel',(SELECT count(*) FROM cls WHERE exigivel AND NOT historico_determinavel),
    'corretores',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.conta_dias_exigiveis DESC) FROM por_corretor p),'[]'::jsonb),
    'serie',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.dia,s.corretor_nome) FROM serie s),'[]'::jsonb)
  ) INTO v_resultado;

  RETURN v_resultado;
END;
$$;

REVOKE ALL ON FUNCTION public.acompanhamento_apurar_diario(timestamptz,timestamptz,integer,text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.acompanhamento_apurar_diario(timestamptz,timestamptz,integer,text[]) TO authenticated;