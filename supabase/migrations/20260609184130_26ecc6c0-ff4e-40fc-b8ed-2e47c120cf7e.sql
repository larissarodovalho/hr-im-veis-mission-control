CREATE POLICY "Marketing sees contas com captacao"
ON public.contas
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'marketing'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.captacoes_imovel ci
    WHERE ci.conta_id = contas.id
  )
);