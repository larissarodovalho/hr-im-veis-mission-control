-- 1) document_signers INSERT scoped
DROP POLICY IF EXISTS "signers insert staff" ON public.document_signers;
CREATE POLICY "signers insert scoped"
ON public.document_signers FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.signed_documents sd
    WHERE sd.id = document_signers.document_id
      AND (
        sd.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = sd.lead_id AND (l.corretor_id = auth.uid() OR l.created_by = auth.uid()))
        OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = sd.conta_id AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid()))
      )
  )
);

-- 2) Remove signed_documents from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.signed_documents;

-- 3) oportunidades SELECT scoped
DROP POLICY IF EXISTS "Staff sees oportunidades" ON public.oportunidades;
CREATE POLICY "Oportunidades scoped read"
ON public.oportunidades FOR SELECT TO authenticated
USING (
  is_admin()
  OR corretor_id = auth.uid()
  OR created_by = auth.uid()
);

-- 4) oportunidade_imoveis SELECT scoped via parent ownership
DROP POLICY IF EXISTS "Staff sees oportunidade_imoveis" ON public.oportunidade_imoveis;
CREATE POLICY "Oportunidade_imoveis scoped read"
ON public.oportunidade_imoveis FOR SELECT TO authenticated
USING (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = oportunidade_imoveis.oportunidade_id
      AND (o.corretor_id = auth.uid() OR o.created_by = auth.uid())
  )
);