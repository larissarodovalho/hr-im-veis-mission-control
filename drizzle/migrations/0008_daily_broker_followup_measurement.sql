CREATE TABLE public.acompanhamento_conta_diario (
  dia date NOT NULL,
  conta_id uuid NOT NULL REFERENCES public.contas(id) ON DELETE CASCADE,
  responsavel_id uuid,
  origem_carteira text NOT NULL,
  ativa boolean NOT NULL DEFAULT true,
  interacao_no_dia boolean NOT NULL DEFAULT false,
  ultima_interacao_em timestamptz,
  tarefa_vencida boolean NOT NULL DEFAULT false,
  proxima_acao_em timestamptz,
  classificacao_base text,
  classificacao_manual boolean NOT NULL DEFAULT false,
  historico_determinavel boolean NOT NULL DEFAULT true,
  apurado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (dia, conta_id)
);

GRANT SELECT ON public.acompanhamento_conta_diario TO authenticated;
GRANT ALL ON public.acompanhamento_conta_diario TO service_role;

ALTER TABLE public.acompanhamento_conta_diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestao pode consultar acompanhamento diario"
ON public.acompanhamento_conta_diario
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor'));

CREATE INDEX acompanhamento_diario_responsavel_dia_idx
ON public.acompanhamento_conta_diario (responsavel_id, dia);

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
AS $$
DECLARE
  v_inicio date := (_inicio AT TIME ZONE 'America/Cuiaba')::date;
  v_fim date := least((_fim AT TIME ZONE 'America/Cuiaba')::date, (now() AT TIME ZONE 'America/Cuiaba')::date);
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

  WITH dias AS (
    SELECT d::date dia
    FROM generate_series(v_inicio, v_fim, interval '1 day') d
    WHERE extract(isodow FROM d) BETWEEN 1 AND 5
  ),
  primeira_atribuicao AS (
    SELECT DISTINCT ON (a.conta_id) a.conta_id,
      coalesce(a.responsavel_anterior_id,a.corretor_original_id) dono_original_id
    FROM public.carteira_atribuicoes a
    ORDER BY a.conta_id,a.atribuida_em,a.created_at
  ),
  contas_origem AS (
    SELECT c.*,
      CASE WHEN c.categoria='marketing' THEN 'marketing'
        WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=coalesce(pa.dono_original_id,c.created_by,c.responsavel_id) AND ur.role IN ('admin','gestor'))
         AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=coalesce(pa.dono_original_id,c.created_by,c.responsavel_id) AND ur.role='corretor') THEN 'base_hr'
        ELSE 'carteira_propria' END origem_calculada
    FROM public.contas c
    LEFT JOIN primeira_atribuicao pa ON pa.conta_id=c.id
  ),
  base AS (
    SELECT d.dia,c.id conta_id,
      coalesce((SELECT a.corretor_id FROM public.carteira_atribuicoes a
        WHERE a.conta_id=c.id AND (a.atribuida_em AT TIME ZONE 'America/Cuiaba')::date <= d.dia
        ORDER BY a.atribuida_em DESC,a.created_at DESC LIMIT 1),c.responsavel_id) responsavel_id,
      c.origem_calculada origem_carteira,
      NOT (coalesce(c.desclassificada,false) AND coalesce((c.qualificacao_em AT TIME ZONE 'America/Cuiaba')::date,(c.updated_at AT TIME ZONE 'America/Cuiaba')::date) < d.dia)
        AND NOT (c.cancelado_em IS NOT NULL AND (c.cancelado_em AT TIME ZONE 'America/Cuiaba')::date < d.dia) ativa,
      EXISTS (SELECT 1 FROM public.interacoes i WHERE i.conta_id=c.id AND (i.created_at AT TIME ZONE 'America/Cuiaba')::date=d.dia) interacao_no_dia,
      (SELECT max(i.created_at) FROM public.interacoes i WHERE i.conta_id=c.id AND (i.created_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia) ultima_interacao_em,
      EXISTS (SELECT 1 FROM public.tarefas t WHERE t.conta_id=c.id AND t.status IS DISTINCT FROM 'Concluída' AND (t.prazo AT TIME ZONE 'America/Cuiaba')::date<=d.dia) tarefa_vencida,
      least(c.proxima_acao_em,(SELECT min(t.prazo) FROM public.tarefas t WHERE t.conta_id=c.id AND t.status IS DISTINCT FROM 'Concluída' AND (t.prazo AT TIME ZONE 'America/Cuiaba')::date>=d.dia)) proxima_acao_em,
      CASE
        WHEN m.classificacao IS NOT NULL AND (m.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia THEN m.classificacao
        WHEN EXISTS (SELECT 1 FROM public.oportunidades o WHERE o.conta_id=c.id AND (o.created_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia) THEN 'virando_oportunidade'
        WHEN (c.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia AND c.etapa_funil IN ('perdido','oportunidade_futura') THEN CASE WHEN c.etapa_funil='perdido' THEN 'etapa_antiga' ELSE 'oportunidade_futura' END
        WHEN (c.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia AND (c.motivo_desclassificacao IS NOT NULL OR c.qualificacao_status='desqualificado') THEN 'desqualificado'
        WHEN (c.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia AND c.qualificacao_status IN ('sem_interesse','sem_retorno','encerrado') THEN c.qualificacao_status
        ELSE NULL
      END classificacao_base,
      (m.classificacao IS NOT NULL AND (m.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia) classificacao_manual,
      CASE WHEN d.dia=(now() AT TIME ZONE 'America/Cuiaba')::date THEN true
        WHEN m.classificacao IS NOT NULL AND (m.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia THEN true
        WHEN EXISTS (SELECT 1 FROM public.oportunidades o WHERE o.conta_id=c.id AND (o.created_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia) THEN true
        WHEN c.updated_at IS NULL OR (c.updated_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia THEN true
        ELSE false END historico_determinavel
    FROM dias d
    JOIN contas_origem c ON (c.created_at AT TIME ZONE 'America/Cuiaba')::date<=d.dia
    LEFT JOIN public.conta_acompanhamento m ON m.conta_id=c.id
    WHERE c.origem_calculada=ANY(v_origens)
  )
  INSERT INTO public.acompanhamento_conta_diario (
    dia,conta_id,responsavel_id,origem_carteira,ativa,interacao_no_dia,ultima_interacao_em,
    tarefa_vencida,proxima_acao_em,classificacao_base,classificacao_manual,historico_determinavel,apurado_em
  )
  SELECT dia,conta_id,responsavel_id,origem_carteira,ativa,interacao_no_dia,ultima_interacao_em,
    tarefa_vencida,proxima_acao_em,classificacao_base,classificacao_manual,historico_determinavel,now()
  FROM base
  ON CONFLICT (dia,conta_id) DO UPDATE SET
    responsavel_id=excluded.responsavel_id,origem_carteira=excluded.origem_carteira,ativa=excluded.ativa,
    interacao_no_dia=excluded.interacao_no_dia,ultima_interacao_em=excluded.ultima_interacao_em,
    tarefa_vencida=excluded.tarefa_vencida,proxima_acao_em=excluded.proxima_acao_em,
    classificacao_base=excluded.classificacao_base,classificacao_manual=excluded.classificacao_manual,
    historico_determinavel=excluded.historico_determinavel,apurado_em=now()
  WHERE public.acompanhamento_conta_diario.dia >= (now() AT TIME ZONE 'America/Cuiaba')::date;

  WITH aval AS (
    SELECT s.*,
      greatest(0,s.dia-(s.ultima_interacao_em AT TIME ZONE 'America/Cuiaba')::date)::int dias_sem_contato,
      (s.ativa AND (s.tarefa_vencida OR s.ultima_interacao_em IS NULL
        OR s.dia-(s.ultima_interacao_em AT TIME ZONE 'America/Cuiaba')::date>=_prazo_dias
        OR (s.proxima_acao_em IS NOT NULL AND (s.proxima_acao_em AT TIME ZONE 'America/Cuiaba')::date<=s.dia))) exigivel
    FROM public.acompanhamento_conta_diario s
    WHERE s.dia BETWEEN v_inicio AND v_fim AND s.origem_carteira=ANY(v_origens)
  ),
  cls AS (
    SELECT a.*,
      CASE WHEN a.classificacao_base IS NOT NULL THEN a.classificacao_base
        WHEN a.exigivel AND NOT a.interacao_no_dia AND (a.ultima_interacao_em IS NULL OR a.dias_sem_contato>=_prazo_dias)
          THEN CASE WHEN a.ultima_interacao_em IS NULL THEN 'crm_desatualizado' ELSE 'falta_followup' END
        ELSE 'ciclo_andamento' END classificacao,
      CASE WHEN a.exigivel THEN (a.interacao_no_dia OR (NOT a.tarefa_vencida AND a.ultima_interacao_em IS NOT NULL AND a.dias_sem_contato<_prazo_dias)) ELSE NULL END crm_atualizado
    FROM aval a
  ),
  elegiveis AS (
    SELECT c.*,coalesce(p.nome,'Sem responsável válido') corretor_nome
    FROM cls c LEFT JOIN public.profiles p ON p.user_id=c.responsavel_id
    WHERE c.exigivel AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id=c.responsavel_id AND ur.role IN ('corretor','admin','gestor'))
  ),
  por_corretor AS (
    SELECT responsavel_id,corretor_nome,count(*)::int conta_dias_exigiveis,count(DISTINCT conta_id)::int contas_exigiveis,
      count(*) FILTER (WHERE crm_atualizado)::int crm_atualizado,
      count(*) FILTER (WHERE NOT crm_atualizado)::int crm_desatualizado,
      count(*) FILTER (WHERE classificacao='falta_followup')::int falta_followup,
      count(*) FILTER (WHERE classificacao='sem_retorno')::int sem_retorno,
      count(*) FILTER (WHERE classificacao='sem_interesse')::int sem_interesse,
      count(*) FILTER (WHERE classificacao='desqualificado')::int desqualificado,
      count(*) FILTER (WHERE classificacao='encerrado')::int encerrado,
      count(*) FILTER (WHERE classificacao='virando_oportunidade')::int virando_oportunidade,
      count(*) FILTER (WHERE classificacao='oportunidade_futura')::int oportunidade_futura,
      count(*) FILTER (WHERE classificacao='etapa_antiga')::int etapa_antiga,
      count(*) FILTER (WHERE classificacao='ciclo_andamento')::int ciclo_andamento,
      count(*) FILTER (WHERE NOT historico_determinavel)::int historico_nao_determinavel
    FROM elegiveis GROUP BY responsavel_id,corretor_nome
  ),
  serie AS (
    SELECT dia,responsavel_id,corretor_nome,count(*)::int conta_dias_exigiveis,
      count(*) FILTER (WHERE crm_atualizado)::int crm_atualizado,
      count(*) FILTER (WHERE NOT crm_atualizado)::int crm_desatualizado,
      count(*) FILTER (WHERE classificacao='falta_followup')::int falta_followup,
      count(*) FILTER (WHERE classificacao='sem_retorno')::int sem_retorno,
      count(*) FILTER (WHERE classificacao='sem_interesse')::int sem_interesse,
      count(*) FILTER (WHERE classificacao='desqualificado')::int desqualificado,
      count(*) FILTER (WHERE classificacao='encerrado')::int encerrado,
      count(*) FILTER (WHERE classificacao='virando_oportunidade')::int virando_oportunidade,
      count(*) FILTER (WHERE classificacao='oportunidade_futura')::int oportunidade_futura,
      count(*) FILTER (WHERE classificacao='etapa_antiga')::int etapa_antiga,
      count(*) FILTER (WHERE classificacao='ciclo_andamento')::int ciclo_andamento
    FROM elegiveis GROUP BY dia,responsavel_id,corretor_nome
  )
  SELECT jsonb_build_object(
    'dias_uteis',(SELECT count(DISTINCT dia) FROM elegiveis),
    'conta_dias_exigiveis',(SELECT count(*) FROM elegiveis),
    'corretores',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.conta_dias_exigiveis DESC) FROM por_corretor p),'[]'::jsonb),
    'serie',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.dia,s.corretor_nome) FROM serie s),'[]'::jsonb)
  ) INTO v_resultado;
  RETURN v_resultado;
END;
$$;

REVOKE ALL ON FUNCTION public.acompanhamento_apurar_diario(timestamptz,timestamptz,integer,text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.acompanhamento_apurar_diario(timestamptz,timestamptz,integer,text[]) TO authenticated;