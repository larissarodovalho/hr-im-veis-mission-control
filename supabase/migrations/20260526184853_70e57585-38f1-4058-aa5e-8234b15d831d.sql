
DROP POLICY IF EXISTS "Staff sees reunioes" ON public.reunioes;
CREATE POLICY "Authenticated sees reunioes"
ON public.reunioes FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Staff sees bloqueios" ON public.agenda_bloqueios;
CREATE POLICY "Authenticated sees bloqueios"
ON public.agenda_bloqueios FOR SELECT
TO authenticated
USING (true);
