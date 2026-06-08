CREATE POLICY "Users see contas linked to own oportunidades"
ON public.contas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.cliente_tipo = 'conta'
      AND o.cliente_id = contas.id
      AND (o.corretor_id = auth.uid() OR o.created_by = auth.uid())
  )
);