
REVOKE ALL ON FUNCTION public.oportunidades_duplicadas() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.oportunidades_unificar(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.oportunidades_duplicadas() TO authenticated;
GRANT EXECUTE ON FUNCTION public.oportunidades_unificar(uuid, uuid) TO authenticated;
