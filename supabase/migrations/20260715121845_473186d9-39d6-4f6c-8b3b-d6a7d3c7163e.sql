
CREATE OR REPLACE FUNCTION public.list_contas_min()
RETURNS TABLE(id uuid, nome text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.nome
  FROM public.contas c
  WHERE public.is_staff()
  ORDER BY c.nome;
$$;

CREATE OR REPLACE FUNCTION public.list_leads_min()
RETURNS TABLE(id uuid, nome text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.id, l.nome
  FROM public.leads l
  WHERE public.is_staff()
  ORDER BY l.nome;
$$;

GRANT EXECUTE ON FUNCTION public.list_contas_min() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_leads_min() TO authenticated;
