
DROP POLICY IF EXISTS "Authenticated insert bloqueios" ON public.agenda_bloqueios;
CREATE POLICY "Staff insert bloqueios" ON public.agenda_bloqueios
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_staff());

DROP POLICY IF EXISTS "Authenticated insert conta_propriedades" ON public.conta_propriedades;
CREATE POLICY "Staff insert conta_propriedades" ON public.conta_propriedades
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_staff());

DROP POLICY IF EXISTS "Authenticated insert notas" ON public.notas;
CREATE POLICY "Staff insert notas" ON public.notas
  FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid() AND public.is_staff());

DROP POLICY IF EXISTS "docs insert auth" ON public.signed_documents;
CREATE POLICY "Staff insert signed_documents" ON public.signed_documents
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_staff());
