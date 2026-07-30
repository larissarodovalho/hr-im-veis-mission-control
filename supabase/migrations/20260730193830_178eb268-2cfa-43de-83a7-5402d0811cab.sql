CREATE OR REPLACE FUNCTION public.get_site_visits_daily(days integer DEFAULT 30)
RETURNS TABLE(dia date, visitas bigint, visitantes_unicos bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH series AS (
    SELECT generate_series(
      ((now() AT TIME ZONE 'America/Cuiaba')::date - (days - 1))::date,
      (now() AT TIME ZONE 'America/Cuiaba')::date,
      '1 day'::interval
    )::date AS dia
  )
  SELECT
    s.dia,
    COALESCE(COUNT(v.id), 0)::bigint AS visitas,
    COALESCE(COUNT(DISTINCT v.session_id), 0)::bigint AS visitantes_unicos
  FROM series s
  LEFT JOIN public.site_visits v
    ON (v.created_at AT TIME ZONE 'America/Cuiaba')::date = s.dia
  WHERE public.is_admin()
  GROUP BY s.dia
  ORDER BY s.dia;
$function$