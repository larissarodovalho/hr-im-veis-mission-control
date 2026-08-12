-- Ranking: ignora atribuições canceladas (lote cancelado)
CREATE OR REPLACE FUNCTION public.carteira_ranking_corretores(_inicio timestamp with time zone DEFAULT NULL::timestamp with time zone, _fim timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(corretor_id uuid, corretor_nome text, posicao integer, score numeric, recebidas integer, contato_estabelecido integer, no_prazo integer, oportunidades integer, fechamentos integer, devolvidas integer, transferidas integer, ativas integer, pct_contato numeric, pct_no_prazo numeric, pct_oportunidade numeric, pct_fechamento numeric, pct_devolucao numeric, horas_medias numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT a.corretor_original_id AS corretor_id,
           coalesce(p.nome, p.email, 'Corretor') AS corretor_nome,
           count(*)::int AS recebidas,
           count(*) FILTER (WHERE a.contato_estabelecido_em IS NOT NULL)::int AS contato_estabelecido,
           count(*) FILTER (WHERE a.primeira_atividade_em IS NOT NULL
                              AND a.prazo_primeiro_contato IS NOT NULL
                              AND a.primeira_atividade_em <= a.prazo_primeiro_contato)::int AS no_prazo,
           count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.oportunidades o WHERE o.conta_id = a.conta_id))::int AS oportunidades,
           count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.conta_fechamentos f WHERE f.conta_id = a.conta_id))::int AS fechamentos,
           count(*) FILTER (WHERE a.status = 'devolvida')::int AS devolvidas,
           count(*) FILTER (WHERE a.status = 'transferida')::int AS transferidas,
           count(*) FILTER (WHERE a.encerrada_em IS NULL)::int AS ativas,
           round(avg(EXTRACT(epoch FROM (a.primeira_atividade_em - a.atribuida_em)) / 3600.0)
                 FILTER (WHERE a.primeira_atividade_em IS NOT NULL), 1) AS horas_medias
    FROM public.carteira_atribuicoes a
    LEFT JOIN public.profiles p ON p.user_id = a.corretor_original_id
    WHERE (_inicio IS NULL OR a.atribuida_em >= _inicio)
      AND (_fim IS NULL OR a.atribuida_em <= _fim)
      AND a.status <> 'cancelado'
      AND NOT EXISTS (SELECT 1 FROM public.carteira_lotes l WHERE l.id = a.lote_id AND l.status = 'cancelado')
      AND (
        public.is_admin()
        OR a.corretor_original_id = auth.uid()
        OR (SELECT coalesce(ranking_visivel, true) FROM public.carteira_config WHERE id = true)
      )
    GROUP BY a.corretor_original_id, coalesce(p.nome, p.email, 'Corretor')
  ),
  scored AS (
    SELECT b.*,
      CASE WHEN b.recebidas = 0 THEN 0 ELSE
        round((
          0.35 * (b.contato_estabelecido::numeric / b.recebidas) +
          0.20 * (b.no_prazo::numeric / b.recebidas) +
          0.20 * (b.oportunidades::numeric / b.recebidas) +
          0.15 * least(b.fechamentos::numeric / b.recebidas, 0.30) +
          0.10 * (1.0 - (b.devolvidas::numeric / b.recebidas))
        ) * 100, 1)
      END AS score,
      CASE WHEN b.recebidas = 0 THEN 0 ELSE round((b.contato_estabelecido::numeric / b.recebidas) * 100, 1) END AS pct_contato,
      CASE WHEN b.recebidas = 0 THEN 0 ELSE round((b.no_prazo::numeric / b.recebidas) * 100, 1) END AS pct_no_prazo,
      CASE WHEN b.recebidas = 0 THEN 0 ELSE round((b.oportunidades::numeric / b.recebidas) * 100, 1) END AS pct_oportunidade,
      CASE WHEN b.recebidas = 0 THEN 0 ELSE round((b.fechamentos::numeric / b.recebidas) * 100, 1) END AS pct_fechamento,
      CASE WHEN b.recebidas = 0 THEN 0 ELSE round((b.devolvidas::numeric / b.recebidas) * 100, 1) END AS pct_devolucao
    FROM base b
  ),
  ranked AS (
    SELECT s.*, rank() OVER (ORDER BY s.score DESC, s.recebidas DESC) AS posicao
    FROM scored s
    WHERE s.recebidas > 0
  )
  SELECT r.corretor_id, r.corretor_nome, r.posicao::int, r.score,
         r.recebidas, r.contato_estabelecido, r.no_prazo, r.oportunidades, r.fechamentos,
         r.devolvidas, r.transferidas, r.ativas,
         r.pct_contato, r.pct_no_prazo, r.pct_oportunidade, r.pct_fechamento, r.pct_devolucao,
         r.horas_medias
  FROM ranked r
  ORDER BY r.posicao;
$function$;

-- Minha posição
CREATE OR REPLACE FUNCTION public.carteira_minha_posicao(_corretor uuid DEFAULT NULL::uuid)
 RETURNS TABLE(corretor_id uuid, corretor_nome text, posicao integer, score numeric, recebidas integer, contato_estabelecido integer, no_prazo integer, oportunidades integer, fechamentos integer, pct_contato numeric, pct_no_prazo numeric, pct_oportunidade numeric, pct_fechamento numeric, pct_devolucao numeric, meta_contatos integer, meta_oportunidades integer, meta_fechamentos integer, total_corretores integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid;
  v_inicio timestamptz;
  v_fim timestamptz;
  v_ano_mes text;
BEGIN
  v_uid := CASE WHEN public.is_admin() AND _corretor IS NOT NULL THEN _corretor ELSE auth.uid() END;
  IF v_uid IS NULL THEN RETURN; END IF;

  v_inicio := date_trunc('month', now() AT TIME ZONE 'America/Cuiaba') AT TIME ZONE 'America/Cuiaba';
  v_fim := (date_trunc('month', now() AT TIME ZONE 'America/Cuiaba') + interval '1 month - 1 second') AT TIME ZONE 'America/Cuiaba';
  v_ano_mes := to_char(now() AT TIME ZONE 'America/Cuiaba', 'YYYY-MM');

  RETURN QUERY
  WITH base AS (
    SELECT a.corretor_original_id AS cid,
           count(*)::int AS recebidas,
           count(*) FILTER (WHERE a.contato_estabelecido_em IS NOT NULL)::int AS contato_estabelecido,
           count(*) FILTER (WHERE a.primeira_atividade_em IS NOT NULL
                              AND a.prazo_primeiro_contato IS NOT NULL
                              AND a.primeira_atividade_em <= a.prazo_primeiro_contato)::int AS no_prazo,
           count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.oportunidades o WHERE o.conta_id = a.conta_id))::int AS oportunidades,
           count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.conta_fechamentos f WHERE f.conta_id = a.conta_id))::int AS fechamentos,
           count(*) FILTER (WHERE a.status = 'devolvida')::int AS devolvidas
    FROM public.carteira_atribuicoes a
    WHERE a.atribuida_em >= v_inicio AND a.atribuida_em <= v_fim
      AND a.status <> 'cancelado'
      AND NOT EXISTS (SELECT 1 FROM public.carteira_lotes l WHERE l.id = a.lote_id AND l.status = 'cancelado')
    GROUP BY a.corretor_original_id
  ),
  scored AS (
    SELECT b.*,
      CASE WHEN b.recebidas = 0 THEN 0 ELSE
        round((
          0.35 * (b.contato_estabelecido::numeric / b.recebidas) +
          0.20 * (b.no_prazo::numeric / b.recebidas) +
          0.20 * (b.oportunidades::numeric / b.recebidas) +
          0.15 * least(b.fechamentos::numeric / b.recebidas, 0.30) +
          0.10 * (1.0 - (b.devolvidas::numeric / b.recebidas))
        ) * 100, 1)
      END AS score,
      CASE WHEN b.recebidas = 0 THEN 0 ELSE round((b.contato_estabelecido::numeric / b.recebidas) * 100, 1) END AS pct_contato,
      CASE WHEN b.recebidas = 0 THEN 0 ELSE round((b.no_prazo::numeric / b.recebidas) * 100, 1) END AS pct_no_prazo,
      CASE WHEN b.recebidas = 0 THEN 0 ELSE round((b.oportunidades::numeric / b.recebidas) * 100, 1) END AS pct_oportunidade,
      CASE WHEN b.recebidas = 0 THEN 0 ELSE round((b.fechamentos::numeric / b.recebidas) * 100, 1) END AS pct_fechamento,
      CASE WHEN b.recebidas = 0 THEN 0 ELSE round((b.devolvidas::numeric / b.recebidas) * 100, 1) END AS pct_devolucao
    FROM base b
  ),
  ranked AS (
    SELECT s.*, rank() OVER (ORDER BY s.score DESC, s.recebidas DESC) AS posicao
    FROM scored s WHERE s.recebidas > 0
  ),
  total AS (SELECT count(*)::int AS n FROM ranked)
  SELECT r.cid, coalesce(p.nome, p.email, 'Corretor'), r.posicao::int, r.score,
         r.recebidas, r.contato_estabelecido, r.no_prazo, r.oportunidades, r.fechamentos,
         r.pct_contato, r.pct_no_prazo, r.pct_oportunidade, r.pct_fechamento, r.pct_devolucao,
         coalesce(m.meta_contatos, 0), coalesce(m.meta_oportunidades, 0), coalesce(m.meta_fechamentos, 0),
         (SELECT n FROM total)
  FROM ranked r
  LEFT JOIN public.profiles p ON p.user_id = r.cid
  LEFT JOIN public.carteira_metas m ON m.corretor_id = r.cid AND m.ano_mes = v_ano_mes
  WHERE r.cid = v_uid;
END;
$function$;

-- Relatório por corretor
CREATE OR REPLACE FUNCTION public.carteira_relatorio_corretores(_inicio timestamp with time zone DEFAULT NULL::timestamp with time zone, _fim timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(corretor_id uuid, corretor_nome text, recebidas integer, com_tentativa integer, sem_tentativa integer, contato_estabelecido integer, no_prazo integer, fora_prazo integer, horas_medias numeric, oportunidades integer, fechamentos integer, devolvidas integer, transferidas integer, ativas integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT a.corretor_original_id,
         coalesce(p.nome, p.email, 'Corretor'),
         count(*)::int,
         count(*) FILTER (WHERE a.tentativas > 0)::int,
         count(*) FILTER (WHERE a.tentativas = 0)::int,
         count(*) FILTER (WHERE a.contato_estabelecido_em IS NOT NULL)::int,
         count(*) FILTER (WHERE a.primeira_atividade_em IS NOT NULL
                            AND a.prazo_primeiro_contato IS NOT NULL
                            AND a.primeira_atividade_em <= a.prazo_primeiro_contato)::int,
         count(*) FILTER (WHERE a.prazo_primeiro_contato IS NOT NULL
                            AND ((a.primeira_atividade_em IS NOT NULL AND a.primeira_atividade_em > a.prazo_primeiro_contato)
                              OR (a.primeira_atividade_em IS NULL AND a.encerrada_em IS NULL AND a.prazo_primeiro_contato < now())))::int,
         round(avg(EXTRACT(epoch FROM (a.primeira_atividade_em - a.atribuida_em)) / 3600.0)
               FILTER (WHERE a.primeira_atividade_em IS NOT NULL), 1),
         count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.oportunidades o WHERE o.conta_id = a.conta_id))::int,
         count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.conta_fechamentos f WHERE f.conta_id = a.conta_id))::int,
         count(*) FILTER (WHERE a.status = 'devolvida')::int,
         count(*) FILTER (WHERE a.status = 'transferida')::int,
         count(*) FILTER (WHERE a.encerrada_em IS NULL)::int
  FROM public.carteira_atribuicoes a
  LEFT JOIN public.profiles p ON p.user_id = a.corretor_original_id
  WHERE public.is_admin()
    AND (_inicio IS NULL OR a.atribuida_em >= _inicio)
    AND (_fim IS NULL OR a.atribuida_em <= _fim)
    AND a.status <> 'cancelado'
    AND NOT EXISTS (SELECT 1 FROM public.carteira_lotes l WHERE l.id = a.lote_id AND l.status = 'cancelado')
  GROUP BY a.corretor_original_id, coalesce(p.nome, p.email, 'Corretor')
  ORDER BY 3 DESC;
$function$;

-- Relatório por lote (mantém o lote na lista, mas não conta atribuições canceladas)
CREATE OR REPLACE FUNCTION public.carteira_relatorio_lotes(_inicio timestamp with time zone DEFAULT NULL::timestamp with time zone, _fim timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(lote_id uuid, lote_nome text, numero integer, corretor_nome text, modo text, status text, criado_em timestamp with time zone, recebidas integer, com_tentativa integer, contato_estabelecido integer, no_prazo integer, oportunidades integer, fechamentos integer, encerradas integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT l.id, l.nome, l.numero, coalesce(p.nome, p.email, 'Corretor'), l.modo, l.status, l.created_at,
         count(a.id)::int,
         count(a.id) FILTER (WHERE a.tentativas > 0)::int,
         count(a.id) FILTER (WHERE a.contato_estabelecido_em IS NOT NULL)::int,
         count(a.id) FILTER (WHERE a.primeira_atividade_em IS NOT NULL
                               AND a.prazo_primeiro_contato IS NOT NULL
                               AND a.primeira_atividade_em <= a.prazo_primeiro_contato)::int,
         count(a.id) FILTER (WHERE EXISTS (SELECT 1 FROM public.oportunidades o WHERE o.conta_id = a.conta_id))::int,
         count(a.id) FILTER (WHERE EXISTS (SELECT 1 FROM public.conta_fechamentos f WHERE f.conta_id = a.conta_id))::int,
         count(a.id) FILTER (WHERE a.encerrada_em IS NOT NULL)::int
  FROM public.carteira_lotes l
  LEFT JOIN public.profiles p ON p.user_id = l.corretor_id
  LEFT JOIN public.carteira_atribuicoes a
    ON a.lote_origem_id = l.id AND a.status <> 'cancelado'
  WHERE public.is_admin()
    AND (_inicio IS NULL OR l.created_at >= _inicio)
    AND (_fim IS NULL OR l.created_at <= _fim)
  GROUP BY l.id, l.nome, l.numero, coalesce(p.nome, p.email, 'Corretor'), l.modo, l.status, l.created_at
  ORDER BY l.created_at DESC;
$function$;

-- Alertas do gestor
CREATE OR REPLACE FUNCTION public.carteira_alertas_gestor()
 RETURNS TABLE(corretor_id uuid, corretor_nome text, ativas integer, atrasadas integer, acao_vencida integer, solicitacoes integer, devolucoes_automaticas_7d integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT a.corretor_id,
         coalesce(p.nome, p.email, 'Corretor'),
         count(*) FILTER (WHERE a.encerrada_em IS NULL)::int,
         count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.tentativas = 0 AND a.prazo_primeiro_contato < now())::int,
         count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.proxima_acao_em IS NOT NULL AND a.proxima_acao_em < now())::int,
         count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.solicitacao_tipo IS NOT NULL)::int,
         count(*) FILTER (WHERE a.motivo_encerramento = 'devolvida_automatica'
                            AND a.encerrada_em > now() - interval '7 days')::int
  FROM public.carteira_atribuicoes a
  LEFT JOIN public.profiles p ON p.user_id = a.corretor_id
  WHERE public.is_admin()
    AND a.status <> 'cancelado'
  GROUP BY a.corretor_id, coalesce(p.nome, p.email, 'Corretor')
  HAVING count(*) FILTER (WHERE a.encerrada_em IS NULL) > 0
      OR count(*) FILTER (WHERE a.motivo_encerramento = 'devolvida_automatica' AND a.encerrada_em > now() - interval '7 days') > 0
  ORDER BY 4 DESC, 3 DESC;
$function$;

-- Alertas do corretor
CREATE OR REPLACE FUNCTION public.carteira_alertas_corretor(_corretor uuid DEFAULT NULL::uuid)
 RETURNS TABLE(atrasadas integer, acao_vencida integer, sem_proxima_acao integer, prazo_hoje integer, total_ativas integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH alvo AS (
    SELECT CASE WHEN public.is_admin() AND _corretor IS NOT NULL THEN _corretor ELSE auth.uid() END AS uid
  )
  SELECT
    count(*) FILTER (WHERE a.tentativas = 0 AND a.prazo_primeiro_contato < now())::int,
    count(*) FILTER (WHERE a.proxima_acao_em IS NOT NULL AND a.proxima_acao_em < now())::int,
    count(*) FILTER (WHERE a.contato_estabelecido_em IS NOT NULL AND a.proxima_acao_em IS NULL)::int,
    count(*) FILTER (WHERE a.tentativas = 0 AND a.prazo_primeiro_contato >= now()
                       AND (a.prazo_primeiro_contato AT TIME ZONE 'America/Cuiaba')::date
                           = (now() AT TIME ZONE 'America/Cuiaba')::date)::int,
    count(*)::int
  FROM public.carteira_atribuicoes a CROSS JOIN alvo
  WHERE a.encerrada_em IS NULL AND a.status <> 'cancelado' AND a.corretor_id = alvo.uid;
$function$;

-- Lotes ativos no acompanhamento: esconde lotes cancelados
CREATE OR REPLACE FUNCTION public.carteira_resumo_lotes()
 RETURNS TABLE(lote_id uuid, lote_nome text, numero integer, corretor_id uuid, operacao_id uuid, criado_em timestamp with time zone, total integer, pendentes integer, atrasadas integer, em_atendimento integer, contato_estabelecido integer, com_oportunidade integer, devolvidas integer, transferidas integer, solicitacoes integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT l.id, l.nome, l.numero, l.corretor_id, l.operacao_id, l.created_at,
    count(a.*)::int,
    count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.status = 'primeiro_contato_pendente')::int,
    count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.contato_estabelecido_em IS NULL
                       AND a.prazo_primeiro_contato < now())::int,
    count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.status = 'em_atendimento')::int,
    count(*) FILTER (WHERE a.contato_estabelecido_em IS NOT NULL)::int,
    count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.oportunidades o
                                    WHERE o.conta_id = a.conta_id
                                      AND o.estagio NOT IN ('ganha','perdida')))::int,
    count(*) FILTER (WHERE a.status = 'devolvida')::int,
    count(*) FILTER (WHERE a.status = 'transferida')::int,
    count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.solicitacao_tipo IS NOT NULL)::int
  FROM public.carteira_lotes l
  LEFT JOIN public.carteira_atribuicoes a ON a.lote_id = l.id AND a.status <> 'cancelado'
  WHERE public.is_admin()
    AND l.status <> 'cancelado'
    AND EXISTS (SELECT 1 FROM public.carteira_operacoes op
                 WHERE op.id = l.operacao_id AND op.status = 'confirmada')
  GROUP BY l.id, l.nome, l.numero, l.corretor_id, l.operacao_id, l.created_at
  ORDER BY l.created_at DESC, l.numero;
$function$;