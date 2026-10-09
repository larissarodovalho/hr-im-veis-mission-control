DROP POLICY IF EXISTS "Authenticated sees reunioes" ON public.reunioes;
CREATE POLICY "Authenticated sees reunioes" ON public.reunioes FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "Authenticated sees bloqueios" ON public.agenda_bloqueios;
CREATE POLICY "Authenticated sees bloqueios" ON public.agenda_bloqueios FOR SELECT TO authenticated USING (public.is_staff());