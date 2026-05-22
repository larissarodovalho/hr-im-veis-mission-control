
-- 1) Remove anon SELECT on imoveis (public site uses imoveis_public view)
DROP POLICY IF EXISTS "Public visitors can view available imoveis" ON public.imoveis;

-- 2) Restrict leads INSERT to staff only
DROP POLICY IF EXISTS "Authenticated can create leads" ON public.leads;
CREATE POLICY "Staff can create leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by AND public.is_staff());

-- 3) Add explicit write policies on booking_links for staff
CREATE POLICY "Staff insert booking_links"
ON public.booking_links
FOR INSERT
TO authenticated
WITH CHECK (public.is_staff());

CREATE POLICY "Staff update booking_links"
ON public.booking_links
FOR UPDATE
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

CREATE POLICY "Admin delete booking_links"
ON public.booking_links
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 4) Fix tarefas UPDATE policy role scope
DROP POLICY IF EXISTS "Staff updates tarefas" ON public.tarefas;
CREATE POLICY "Staff updates tarefas"
ON public.tarefas
FOR UPDATE
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());
