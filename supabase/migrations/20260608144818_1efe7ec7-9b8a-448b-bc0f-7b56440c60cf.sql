CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  user_agent text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX site_visits_created_at_idx ON public.site_visits (created_at DESC);
CREATE INDEX site_visits_session_idx ON public.site_visits (session_id);

GRANT INSERT ON public.site_visits TO anon, authenticated;
GRANT SELECT ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert site visits"
ON public.site_visits FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admin/gestor can read site visits"
ON public.site_visits FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.get_site_visits_daily(days integer DEFAULT 30)
RETURNS TABLE(dia date, visitas bigint, visitantes_unicos bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH series AS (
    SELECT generate_series(
      (current_date - (days - 1))::date,
      current_date,
      '1 day'::interval
    )::date AS dia
  )
  SELECT
    s.dia,
    COALESCE(COUNT(v.id), 0)::bigint AS visitas,
    COALESCE(COUNT(DISTINCT v.session_id), 0)::bigint AS visitantes_unicos
  FROM series s
  LEFT JOIN public.site_visits v
    ON v.created_at >= s.dia
   AND v.created_at < (s.dia + INTERVAL '1 day')
  WHERE public.is_admin()
  GROUP BY s.dia
  ORDER BY s.dia;
$$;

GRANT EXECUTE ON FUNCTION public.get_site_visits_daily(integer) TO authenticated;