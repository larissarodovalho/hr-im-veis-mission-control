CREATE OR REPLACE FUNCTION public.conta_tem_captacao(_conta_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.captacoes_imovel
    WHERE conta_id = _conta_id
  )
$$;

DROP POLICY IF EXISTS "Marketing sees contas com captacao" ON public.contas;

CREATE POLICY "Marketing sees contas com captacao"
ON public.contas
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'marketing'::app_role)
  AND public.conta_tem_captacao(contas.id)
);