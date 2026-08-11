CREATE OR REPLACE FUNCTION public.carteira_relatorio_corretores(_inicio timestamptz DEFAULT NULL, _fim timestamptz DEFAULT NULL)
RETURNS TABLE(
  corretor_id uuid, corretor_nome text, recebidas int, com_tentativa int, sem_tentativa int,
  contato_estabelecido int, no_prazo int, fora_prazo int, horas_medias numeric,
  oportunidades int, fechamentos int, devolvidas int, transferidas int, ativas int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
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
  GROUP BY a.corretor_original_id, coalesce(p.nome, p.email, 'Corretor')
  ORDER BY 3 DESC;
$$;

CREATE OR REPLACE FUNCTION public.carteira_relatorio_lotes(_inicio timestamptz DEFAULT NULL, _fim timestamptz DEFAULT NULL)
RETURNS TABLE(
  lote_id uuid, lote_nome text, numero int, corretor_nome text, modo text, status text,
  criado_em timestamptz, recebidas int, com_tentativa int, contato_estabelecido int,
  no_prazo int, oportunidades int, fechamentos int, encerradas int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
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
  LEFT JOIN public.carteira_atribuicoes a ON a.lote_origem_id = l.id
  WHERE public.is_admin()
    AND (_inicio IS NULL OR l.created_at >= _inicio)
    AND (_fim IS NULL OR l.created_at <= _fim)
  GROUP BY l.id, l.nome, l.numero, coalesce(p.nome, p.email, 'Corretor'), l.modo, l.status, l.created_at
  ORDER BY l.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.carteira_relatorio_motivos(_inicio timestamptz DEFAULT NULL, _fim timestamptz DEFAULT NULL)
RETURNS TABLE(tipo text, motivo text, total int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT e.tipo,
         coalesce(nullif(trim(coalesce(e.motivo, e.observacao)), ''), 'Sem motivo informado'),
         count(*)::int
  FROM public.carteira_eventos e
  WHERE public.is_admin()
    AND e.tipo IN ('devolucao', 'transferencia', 'solicitacao_devolucao', 'solicitacao_transferencia')
    AND (_inicio IS NULL OR e.created_at >= _inicio)
    AND (_fim IS NULL OR e.created_at <= _fim)
  GROUP BY 1, 2
  ORDER BY 3 DESC;
$$;

CREATE OR REPLACE FUNCTION public.carteira_eventos_conta(_conta_id uuid)
RETURNS TABLE(
  id uuid, tipo text, motivo text, observacao text, status_anterior text, status_novo text,
  lote_nome text, responsavel_anterior text, responsavel_novo text, autor text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT e.id, e.tipo, e.motivo, e.observacao, e.status_anterior, e.status_novo,
         l.nome,
         coalesce(pa.nome, pa.email), coalesce(pn.nome, pn.email), coalesce(pc.nome, pc.email, 'Sistema'),
         e.created_at
  FROM public.carteira_eventos e
  LEFT JOIN public.carteira_lotes l ON l.id = coalesce(e.lote_novo_id, e.lote_id)
  LEFT JOIN public.profiles pa ON pa.user_id = e.responsavel_anterior_id
  LEFT JOIN public.profiles pn ON pn.user_id = e.responsavel_novo_id
  LEFT JOIN public.profiles pc ON pc.user_id = e.created_by
  WHERE e.conta_id = _conta_id
    AND (
      public.is_admin()
      OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = _conta_id AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.carteira_atribuicoes a WHERE a.conta_id = _conta_id AND a.corretor_id = auth.uid())
    )
  ORDER BY e.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.carteira_lote_da_conta(_conta_id uuid)
RETURNS TABLE(lote_nome text, corretor_id uuid, atribuida_em timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT l.nome, a.corretor_id, a.atribuida_em
  FROM public.carteira_atribuicoes a
  LEFT JOIN public.carteira_lotes l ON l.id = a.lote_id
  WHERE a.conta_id = _conta_id AND a.encerrada_em IS NULL
    AND (public.is_staff())
  ORDER BY a.atribuida_em DESC
  LIMIT 1;
$$;