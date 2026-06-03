-- 1. Remove sensitive tables from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.document_signers;
ALTER PUBLICATION supabase_realtime DROP TABLE public.document_events;

-- 2. Tighten UPDATE policy on document_signers to mirror SELECT scope
DROP POLICY IF EXISTS "signers update staff" ON public.document_signers;
CREATE POLICY "signers update scoped"
ON public.document_signers
FOR UPDATE
USING (
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
)
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

-- 3. Restrict imoveis-originais storage bucket to staff roles only
DROP POLICY IF EXISTS "Authenticated read originais" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload originais" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update originais" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete originais" ON storage.objects;

CREATE POLICY "Staff read originais"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'imoveis-originais' AND public.is_staff());

CREATE POLICY "Staff upload originais"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'imoveis-originais'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'corretor'::app_role)
  )
);

CREATE POLICY "Staff update originais"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'imoveis-originais'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'corretor'::app_role)
  )
);

CREATE POLICY "Staff delete originais"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'imoveis-originais'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'corretor'::app_role)
  )
);