
-- 1) booking_links: remove secretaria do SELECT em massa
DROP POLICY IF EXISTS "Booking links scoped read" ON public.booking_links;
CREATE POLICY "Booking links scoped read" ON public.booking_links
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR (EXISTS (SELECT 1 FROM leads l WHERE l.id = booking_links.lead_id AND (l.corretor_id = auth.uid() OR l.created_by = auth.uid())))
  OR (EXISTS (SELECT 1 FROM reunioes r WHERE r.id = booking_links.reuniao_id AND (r.corretor_id = auth.uid() OR r.created_by = auth.uid())))
);

-- também aperta INSERT: secretaria não cria tokens diretamente (edge functions usam service role)
DROP POLICY IF EXISTS "Staff insert booking_links scoped" ON public.booking_links;
CREATE POLICY "Staff insert booking_links scoped" ON public.booking_links
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR (lead_id IS NOT NULL AND EXISTS (SELECT 1 FROM leads l WHERE l.id = booking_links.lead_id AND (l.corretor_id = auth.uid() OR l.created_by = auth.uid())))
  OR (reuniao_id IS NOT NULL AND EXISTS (SELECT 1 FROM reunioes r WHERE r.id = booking_links.reuniao_id AND (r.corretor_id = auth.uid() OR r.created_by = auth.uid())))
);

-- 2) storage: restringe DELETE do bucket "imoveis" a admin/gestor
DROP POLICY IF EXISTS "Staff delete imoveis bucket" ON storage.objects;
CREATE POLICY "Admins delete imoveis bucket" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'imoveis'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role))
);
