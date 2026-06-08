DROP POLICY IF EXISTS "Staff insert booking_links" ON public.booking_links;

CREATE POLICY "Staff insert booking_links scoped"
ON public.booking_links
FOR INSERT
TO authenticated
WITH CHECK (
  is_staff() AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'secretaria'::app_role)
    OR (
      lead_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.leads l
        WHERE l.id = booking_links.lead_id
          AND (l.corretor_id = auth.uid() OR l.created_by = auth.uid())
      )
    )
    OR (
      reuniao_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.reunioes r
        WHERE r.id = booking_links.reuniao_id
          AND (r.corretor_id = auth.uid() OR r.created_by = auth.uid())
      )
    )
  )
);