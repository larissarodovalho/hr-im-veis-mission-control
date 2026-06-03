DROP POLICY IF EXISTS "docs update staff" ON public.signed_documents;

CREATE POLICY "docs update scoped"
ON public.signed_documents
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = signed_documents.lead_id AND (l.corretor_id = auth.uid() OR l.created_by = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = signed_documents.conta_id AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = signed_documents.lead_id AND (l.corretor_id = auth.uid() OR l.created_by = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = signed_documents.conta_id AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid()))
);