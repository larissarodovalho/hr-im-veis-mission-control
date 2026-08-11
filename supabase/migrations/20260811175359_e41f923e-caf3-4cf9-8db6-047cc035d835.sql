-- ===========================================================
-- Fase 5: Ranking e gamificação da carteira
-- ===========================================================

-- 1. Tabela de metas mensais por corretor
CREATE TABLE public.carteira_metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  ano_mes text NOT NULL, -- formato YYYY-MM
  meta_contatos integer NOT NULL DEFAULT 0,
  meta_oportunidades integer NOT NULL DEFAULT 0,
  meta_fechamentos integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT carteira_metas_unique UNIQUE (corretor_id, ano_mes),
  CONSTRAINT carteira_metas_ano_mes_fmt CHECK (ano_mes ~ '^\d{4}-(0[1-9]|1[0-2])$')
);

GRANT SELECT ON public.carteira_metas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.carteira_metas TO authenticated;
GRANT ALL ON public.carteira_metas TO service_role;

ALTER TABLE public.carteira_metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carteira_metas_select" ON public.carteira_metas
  FOR SELECT TO authenticated
  USING (public.is_admin() OR corretor_id = auth.uid());
CREATE POLICY "carteira_metas_insert" ON public.carteira_metas
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "carteira_metas_update" ON public.carteira_metas
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "carteira_metas_delete" ON public.carteira_metas
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Trigger de updated_at
CREATE TRIGGER update_carteira_metas_updated_at
  BEFORE UPDATE ON public.carteira_metas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Coluna ranking_visivel em carteira_config
ALTER TABLE public.carteira_config
  ADD COLUMN IF NOT EXISTS ranking_visivel boolean NOT NULL DEFAULT true;

-- 3. Placar de corretores (ranking + score)
CREATE OR REPLACE FUNCTION public.carteira_ranking_corretores(_inicio timestamptz DEFAULT NULL, _fim timestamptz DEFAULT NULL)
RETURNS TABLE(
  corretor_id uuid, corretor_nome text, posicao int, score numeric,
  recebidas int, contato_estabelecido int, no_prazo int, oportunidades int, fechamentos int,
  devolvidas int, transferidas int, ativas int,
  pct_contato numeric, pct_no_prazo numeric, pct_oportunidade numeric, pct_fechamento numeric, pct_devolucao numeric,
  horas_medias numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.carteira_ranking_corretores(timestamptz, timestamptz) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.carteira_ranking_corretores(timestamptz, timestamptz) TO authenticated, service_role;

-- 4. Posição do próprio corretor no mês corrente (com metas)
CREATE OR REPLACE FUNCTION public.carteira_minha_posicao(_corretor uuid DEFAULT NULL)
RETURNS TABLE(
  corretor_id uuid, corretor_nome text, posicao int, score numeric,
  recebidas int, contato_estabelecido int, no_prazo int, oportunidades int, fechamentos int,
  pct_contato numeric, pct_no_prazo numeric, pct_oportunidade numeric, pct_fechamento numeric, pct_devolucao numeric,
  meta_contatos int, meta_oportunidades int, meta_fechamentos int,
  total_corretores int
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
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

REVOKE ALL ON FUNCTION public.carteira_minha_posicao(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.carteira_minha_posicao(uuid) TO authenticated, service_role;

-- 5. Upsert de metas (apenas gestor/admin)
CREATE OR REPLACE FUNCTION public.carteira_metas_upsert(_corretor uuid, _ano_mes text, _contatos int, _oportunidades int, _fechamentos int)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas gestores e administradores podem definir metas.';
  END IF;
  IF _corretor IS NULL OR _ano_mes !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'Corretor e ano-mês válidos são obrigatórios.';
  END IF;
  INSERT INTO public.carteira_metas (corretor_id, ano_mes, meta_contatos, meta_oportunidades, meta_fechamentos, created_by)
  VALUES (_corretor, _ano_mes, _contatos, _oportunidades, _fechamentos, auth.uid())
  ON CONFLICT (corretor_id, ano_mes) DO UPDATE SET
    meta_contatos = EXCLUDED.meta_contatos,
    meta_oportunidades = EXCLUDED.meta_oportunidades,
    meta_fechamentos = EXCLUDED.meta_fechamentos,
    updated_at = now();
END;
$function$;

REVOKE ALL ON FUNCTION public.carteira_metas_upsert(uuid, text, int, int, int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.carteira_metas_upsert(uuid, text, int, int, int) TO authenticated, service_role;