CREATE OR REPLACE FUNCTION public.acompanhamento_apurar_diario(
  _inicio timestamp with time zone,
  _fim timestamp with time zone,
  _prazo_dias integer DEFAULT 7,
  _origens_carteira text[] DEFAULT ARRAY['base_hr'::text, 'marketing'::text, 'carteira_propria'::text]
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
SET statement_timeout TO '25s'
AS $fn$
DECLARE
  v_inicio date := (_inicio AT TIME ZONE 'America/Cuiaba')::date;
  v_fim date := least((_fim AT TIME ZONE 'America/Cuiaba')::date, (now() AT TIME ZONE 'America/Cuiaba')::date);
  v_hoje date := (now() AT TIME ZONE 'America/Cuiaba')::date;
  v_origens text[] := coalesce(_origens_carteira, ARRAY['base_hr','marketing','carteira_propria']::text[]);
  v_desist text := '(desist|sem[ _-]?interesse|nao tem interesse|não tem interesse|desinteress|nao quer|não quer)';
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

  WITH dias AS MATERIALIZED (
    SELECT d::date dia
    FROM generate_series(v_inicio,v_fim,interval '1 day') d
    WHERE extract(isodow FROM d) BETWEEN 1 AND 5
  ),
  primeira_atribuicao AS MATERIALIZED (
    SELECT DISTINCT ON (a.conta_id) a.conta_id,a.atribuida_em,
      coalesce(a.responsavel_anterior_id,a.corretor_original_id) dono_original_id
    FROM public.carteira_atribuicoes a
    ORDER BY a.conta_id,a.atribuida_em,a.created_at
  ),
  contas_desfecho AS MATERIALIZED (
    SELECT c.id conta_id,
      CASE
        WHEN coalesce(c.desclassificada,false) OR c.motivo_desclassificacao IS NOT NULL
          THEN CASE WHEN c.motivo_desclassificacao ~* v_desist THEN 'sem_interesse' ELSE 'desqualificado' END
        WHEN c.cancelado_em IS NOT NULL AND c.motivo_cancelamento ~* v_desist THEN 'sem_interesse'
        WHEN c.cancelado_em IS NOT NULL THEN 'encerrado'
        WHEN c.etapa_funil='contato_cancelado' THEN 'encerrado'
        WHEN c.etapa_funil='sem_retorno' THEN 'sem_retorno'
        WHEN c.qualificacao_status IN ('sem_interesse','sem_retorno','encerrado') THEN c.qualificacao_status
        ELSE NULL END desfecho_tipo,
      CASE
        WHEN coalesce(c.desclassificada,false) OR c.motivo_desclassificacao IS NOT NULL
          THEN coalesce((c.qualificacao_em AT TIME ZONE 'America/Cuiaba')::date,(c.cancelado_em AT TIME ZONE 'America/Cuiaba')::date,(c.updated_at AT TIME ZONE 'America/Cuiaba')::date)
        WHEN c.cancelado_em IS NOT NULL THEN (c.cancelado_em AT TIME ZONE 'America/Cuiaba')::date
        WHEN c.etapa_funil IN ('contato_cancelado','sem_retorno')
          THEN coalesce((c.qualificacao_em AT TIME ZONE 'America/Cuiaba')::date,(c.updated_at AT TIME ZONE 'America/Cuiaba')::date)
        WHEN c.qualificacao_status IN ('sem_interesse','sem_retorno','encerrado')
          THEN coalesce((c.qualificacao_em AT TIME ZONE 'America/Cuiaba')::date,(c.updated_at AT TIME ZONE 'America/Cuiaba')::date)
        ELSE NULL END desfecho_data
    FROM public.contas c
    WHERE (c.created_at AT TIME ZONE 'America/Cuiaba')::date<=v_fim
  ),
  contas_base AS MATERIALIZED (
    SELECT c.*,pa.atribuida_em primeira_atribuicao_em,pa.dono_original_id,
      cd.desfecho_tipo,
      (SELECT min(d.dia) FROM dias d WHERE cd.desfecho_data IS NOT NULL AND d.dia >= cd.desfecho_data) desfecho_dia,
      CASE WHEN c.categoria='marketing' THEN 'marketing'
        WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=coalesce(pa.dono_original_id,c.created_by,c.responsavel_id) AND ur.role IN ('admin','gestor'))
         AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=coalesce(pa.dono_original_id,c.created_by,c.responsavel_id) AND ur.role='corretor') THEN 'base_hr'
        ELSE 'carteira_propria' END origem_calculada
    FROM public.contas c
    LEFT JOIN primeira_atribuicao pa ON pa.conta_id=c.id
    LEFT JOIN contas_desfecho cd ON cd.conta_id=c.id
    WHERE (c.created_at AT TIME ZONE 'America/Cuiaba')::date<=v_fim
  ),
  interacoes_antes AS MATERIALIZED (
    SELECT i.conta_id,max(i.created_at) ultima_antes
    FROM public.interacoes i
    WHERE i.conta_id IS NOT NULL AND (i.created_at AT TIME ZONE 'America/Cuiaba')::date<v_inicio
    GROUP BY i.conta_id
  ),
  interacoes_dia AS MATERIALIZED (
    SELECT i.conta_id,(i.created_at AT TIME ZONE 'America/Cuiaba')::date dia,max(i.created_at) ultima_no_dia
    FROM public.interacoes i
    WHERE i.conta_id IS NOT NULL
      AND (i.created_at AT TIME ZONE 'America/Cuiaba')::date BETWEEN v_inicio AND v_fim
    GROUP BY i.conta_id,(i.created_at AT TIME ZONE 'America/Cuiaba')::date
  ),
  tarefas_abertas AS MATERIALIZED (
    SELECT t.conta_id,min(t.prazo) primeiro_prazo
    FROM public.tarefas t
    WHERE t.conta_id IS NOT NULL AND t.status IS DISTINCT FROM 'Concluída'
    GROUP BY t.conta_id
  ),
  primeira_oportunidade AS MATERIALIZED (
    SELECT DISTINCT ON (o.conta_id) o.conta_id,o.created_at,o.corretor_id
    FROM public.oportunidades o
    WHERE o.conta_id IS NOT NULL
    ORDER BY o.conta_id,o.created_at,o.id
  ),
  grade_base AS MATERIALIZED (
    SELECT d.dia,c.id conta_id,c.origem_calculada origem_carteira,c.responsavel_id responsavel_atual_id,
      c.created_by,c.dono_original_id,c.primeira_atribuicao_em,
      c.desfecho_tipo,c.desfecho_dia,
      NOT (coalesce(c.desclassificada,false) AND coalesce((c.qualificacao_em AT TIME ZONE 'America/Cuiaba')::date,(c.updated_at AT TIME ZONE 'America/Cuiaba')::date)<d.dia)
        AND NOT (c.cancelado_em IS NOT NULL AND (c.cancelado_em AT TIME ZONE 'America/Cuiaba')::date<d.dia) ativa,
      idc.ultima_no_dia,ia.ultima_antes,ta.primeiro_prazo,c.proxima_acao_em,
      c.updated_at,c.etapa_funil,c.motivo_desclassificacao,c.qualificacao_status,
      m.classificacao classificacao_manual,m.updated_at classificacao_manual_em,
      po.created_at oportunidade_em,po.corretor_id oportunidade_corretor_id
    FROM dias d
    JOIN contas_base c ON (c.created_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia AND c.origem_calculada=ANY(v_origens)
    LEFT JOIN interacoes_dia idc ON idc.conta_id=c.id AND idc.dia=d.dia
    LEFT JOIN interacoes_antes ia ON ia.conta_id=c.id
    LEFT JOIN tarefas_abertas ta ON ta.conta_id=c.id
    LEFT JOIN public.conta_acompanhamento m ON m.conta_id=c.id
    LEFT JOIN primeira_oportunidade po ON po.conta_id=c.id
  ),
  grade_interacoes AS MATERIALIZED (
    SELECT g.*,
      coalesce(max(g.ultima_no_dia) OVER (PARTITION BY g.conta_id ORDER BY g.dia ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW),g.ultima_antes) ultima_interacao_em
    FROM grade_base g
  ),
  grade AS MATERIALIZED (
    SELECT g.*,
      coalesce((SELECT a.corretor_id FROM public.carteira_atribuicoes a
        WHERE a.conta_id=g.conta_id AND (a.atribuida_em AT TIME ZONE 'America/Cuiaba')::date<=g.dia
        ORDER BY a.atribuida_em DESC,a.created_at DESC LIMIT 1),
        CASE WHEN g.primeira_atribuicao_em IS NOT NULL AND (g.primeira_atribuicao_em AT TIME ZONE 'America/Cuiaba')::date>g.dia
          THEN coalesce(g.dono_original_id,g.created_by,g.responsavel_atual_id) ELSE g.responsavel_atual_id END) responsavel_conta_id,
      (g.ultima_no_dia IS NOT NULL) interacao_no_dia,
      (g.primeiro_prazo IS NOT NULL AND (g.primeiro_prazo AT TIME ZONE 'America/Cuiaba')::date<=g.dia) tarefa_vencida,
      least(g.proxima_acao_em,g.primeiro_prazo) proxima_acao_calculada,
      (g.desfecho_tipo IS NOT NULL AND g.desfecho_dia IS NOT NULL AND g.dia=g.desfecho_dia) dia_do_desfecho
    FROM grade_interacoes g
  ),
  aval AS MATERIALIZED (
    SELECT g.*,
      CASE WHEN g.ultima_interacao_em IS NULL THEN 999999 ELSE greatest(0,g.dia-(g.ultima_interacao_em AT TIME ZONE 'America/Cuiaba')::date)::int END dias_sem_contato,
      (g.ativa AND (g.tarefa_vencida OR g.ultima_interacao_em IS NULL
        OR g.dia-(g.ultima_interacao_em AT TIME ZONE 'America/Cuiaba')::date>=_prazo_dias
        OR (g.proxima_acao_calculada IS NOT NULL AND (g.proxima_acao_calculada AT TIME ZONE 'America/Cuiaba')::date<=g.dia))) exigivel_atividade,
      CASE WHEN g.oportunidade_em IS NOT NULL AND (g.oportunidade_em AT TIME ZONE 'America/Cuiaba')::date<=g.dia
        THEN coalesce(g.oportunidade_corretor_id,g.responsavel_conta_id) ELSE g.responsavel_conta_id END responsavel_metrica_id,
      CASE
        WHEN g.classificacao_manual IS NOT NULL AND (g.classificacao_manual_em AT TIME ZONE 'America/Cuiaba')::date<=g.dia THEN g.classificacao_manual
        WHEN g.oportunidade_em IS NOT NULL AND (g.oportunidade_em AT TIME ZONE 'America/Cuiaba')::date<=g.dia THEN 'virando_oportunidade'
        WHEN g.dia_do_desfecho THEN g.desfecho_tipo
        WHEN (g.updated_at AT TIME ZONE 'America/Cuiaba')::date<=g.dia AND g.etapa_funil IN ('perdido','oportunidade_futura') THEN CASE WHEN g.etapa_funil='perdido' THEN 'etapa_antiga' ELSE 'oportunidade_futura' END
        ELSE NULL END classificacao_base,
      CASE WHEN g.dia=v_hoje THEN true
        WHEN g.dia_do_desfecho THEN true
        WHEN g.classificacao_manual IS NOT NULL AND (g.classificacao_manual_em AT TIME ZONE 'America/Cuiaba')::date<=g.dia THEN true
        WHEN g.oportunidade_em IS NOT NULL AND (g.oportunidade_em AT TIME ZONE 'America/Cuiaba')::date<=g.dia THEN true
        WHEN g.updated_at IS NULL OR (g.updated_at AT TIME ZONE 'America/Cuiaba')::date<=g.dia THEN true
        ELSE false END historico_determinavel
    FROM grade g
  ),
  cls AS MATERIALIZED (
    SELECT a.*,
      (a.exigivel_atividade OR a.dia_do_desfecho) exigivel,
      CASE WHEN a.classificacao_base IS NOT NULL THEN a.classificacao_base
        WHEN a.exigivel_atividade AND NOT a.interacao_no_dia AND (a.ultima_interacao_em IS NULL OR a.dias_sem_contato>=_prazo_dias)
          THEN CASE WHEN a.ultima_interacao_em IS NULL THEN 'crm_desatualizado' ELSE 'falta_followup' END
        ELSE 'ciclo_andamento' END classificacao,
      CASE WHEN a.exigivel_atividade AND NOT a.dia_do_desfecho
        THEN (a.interacao_no_dia OR (NOT a.tarefa_vencida AND a.ultima_interacao_em IS NOT NULL AND a.dias_sem_contato<_prazo_dias))
        ELSE NULL END crm_atualizado
    FROM aval a
  ),
  gravar AS (
    INSERT INTO public.acompanhamento_conta_diario (
      dia,conta_id,responsavel_id,origem_carteira,ativa,interacao_no_dia,ultima_interacao_em,
      tarefa_vencida,proxima_acao_em,classificacao_base,classificacao_manual,historico_determinavel,apurado_em
    )
    SELECT dia,conta_id,responsavel_conta_id,origem_carteira,ativa,interacao_no_dia,ultima_interacao_em,
      tarefa_vencida,proxima_acao_calculada,classificacao_base,(classificacao_manual IS NOT NULL),historico_determinavel,now()
    FROM cls
    WHERE dia=v_hoje AND extract(isodow FROM v_hoje) BETWEEN 1 AND 5
    ON CONFLICT (dia,conta_id) DO UPDATE SET
      responsavel_id=excluded.responsavel_id,origem_carteira=excluded.origem_carteira,ativa=excluded.ativa,
      interacao_no_dia=excluded.interacao_no_dia,ultima_interacao_em=excluded.ultima_interacao_em,
      tarefa_vencida=excluded.tarefa_vencida,proxima_acao_em=excluded.proxima_acao_em,
      classificacao_base=excluded.classificacao_base,classificacao_manual=excluded.classificacao_manual,
      historico_determinavel=excluded.historico_determinavel,apurado_em=now()
    RETURNING 1
  ),
  elegiveis AS MATERIALIZED (
    SELECT c.*,coalesce(p.nome,'Sem responsável válido') corretor_nome
    FROM cls c LEFT JOIN public.profiles p ON p.user_id=c.responsavel_metrica_id
    WHERE c.exigivel AND c.historico_determinavel
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=c.responsavel_metrica_id AND ur.role IN ('corretor','admin','gestor'))
  ),
  por_corretor AS (
    SELECT responsavel_metrica_id responsavel_id,corretor_nome,count(*)::int conta_dias_exigiveis,count(DISTINCT conta_id)::int contas_exigiveis,
      count(*) FILTER (WHERE crm_atualizado IS NOT NULL)::int crm_base,
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
      count(*) FILTER (WHERE crm_atualizado IS NOT NULL)::int crm_base,
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
    'registros_gravados',(SELECT count(*) FROM gravar),
    'corretores',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.conta_dias_exigiveis DESC) FROM por_corretor p),'[]'::jsonb),
    'serie',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.dia,s.corretor_nome) FROM serie s),'[]'::jsonb)
  ) INTO v_resultado;

  RETURN v_resultado;
END;
$fn$;