
DROP POLICY IF EXISTS "Admin deletes oportunidades" ON public.oportunidades;
CREATE POLICY "Owner or admin deletes oportunidades"
ON public.oportunidades
FOR DELETE
TO authenticated
USING (is_admin() OR corretor_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Staff sees all contas (agenda)"
ON public.contas
FOR SELECT
TO authenticated
USING (is_staff());
