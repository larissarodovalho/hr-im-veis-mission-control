CREATE POLICY "Marketing updates contas com captacao"
ON public.contas
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'marketing'::app_role)
  AND public.conta_tem_captacao(id)
)
WITH CHECK (
  has_role(auth.uid(), 'marketing'::app_role)
  AND public.conta_tem_captacao(id)
);