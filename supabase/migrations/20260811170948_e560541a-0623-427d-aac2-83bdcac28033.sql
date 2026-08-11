CREATE OR REPLACE FUNCTION public.carteira_elegiveis_count(_filtros jsonb DEFAULT '{}'::jsonb, _q text DEFAULT NULL)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.carteira_elegiveis(_filtros, _q);
$$;
REVOKE EXECUTE ON FUNCTION public.carteira_elegiveis_count(jsonb, text) FROM anon;