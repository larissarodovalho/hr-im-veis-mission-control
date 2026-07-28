
CREATE OR REPLACE FUNCTION public.check_duplicate_contact(_phone text, _email text)
RETURNS TABLE(
  entidade text,
  id uuid,
  nome text,
  etapa text,
  responsavel_nome text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH inp AS (
    SELECT
      NULLIF(public.normalize_br_phone(_phone), '') AS p,
      NULLIF(lower(trim(_email)), '') AS e
  )
  SELECT 'conta'::text, c.id, c.nome, c.etapa_funil,
         COALESCE(p.nome, p.email, '—')
    FROM public.contas c
    LEFT JOIN public.profiles p ON p.user_id = c.responsavel_id
    CROSS JOIN inp
   WHERE public.is_staff()
     AND (
       (inp.p IS NOT NULL AND public.normalize_br_phone(c.telefone) = inp.p)
       OR (inp.e IS NOT NULL AND lower(trim(c.email)) = inp.e)
     )
  UNION ALL
  SELECT 'lead'::text, l.id, l.nome, l.etapa_funil,
         COALESCE(p.nome, p.email, '—')
    FROM public.leads l
    LEFT JOIN public.profiles p ON p.user_id = l.corretor_id
    CROSS JOIN inp
   WHERE public.is_staff()
     AND (
       (inp.p IS NOT NULL AND public.normalize_br_phone(l.telefone) = inp.p)
       OR (inp.e IS NOT NULL AND lower(trim(l.email)) = inp.e)
     )
   LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.check_duplicate_contact(text, text) TO authenticated;
