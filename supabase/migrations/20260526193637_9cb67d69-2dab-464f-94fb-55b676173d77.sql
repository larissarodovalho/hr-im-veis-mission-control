CREATE POLICY "Staff sees all leads (agenda)"
ON public.leads FOR SELECT TO authenticated
USING (public.is_staff());