CREATE OR REPLACE FUNCTION public.search_contas_min(_q text DEFAULT NULL, _limit integer DEFAULT 30)
RETURNS TABLE(id uuid, nome text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH inp AS (
    SELECT nullif(trim(coalesce(_q, '')), '') AS q
  )
  SELECT c.id, c.nome
  FROM public.contas c
  CROSS JOIN inp
  WHERE public.is_staff()
    AND (
      inp.q IS NULL
      OR c.nome ILIKE '%' || inp.q || '%'
      OR lower(coalesce(c.email, '')) LIKE '%' || lower(inp.q) || '%'
      OR (
        public.normalize_br_phone(inp.q) <> ''
        AND public.normalize_br_phone(c.telefone) = public.normalize_br_phone(inp.q)
      )
    )
  ORDER BY
    CASE WHEN inp.q IS NULL THEN 0 ELSE 1 END,
    CASE WHEN inp.q IS NOT NULL AND c.nome ILIKE inp.q || '%' THEN 0 ELSE 1 END,
    CASE WHEN inp.q IS NULL THEN c.created_at END DESC,
    c.nome
  LIMIT greatest(1, least(coalesce(_limit, 30), 100));
$$;

GRANT EXECUTE ON FUNCTION public.search_contas_min(text, integer) TO authenticated;