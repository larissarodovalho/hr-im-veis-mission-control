DROP POLICY IF EXISTS "Owner or admin/gestor updates tarefas" ON public.tarefas;
CREATE POLICY "Staff updates tarefas" ON public.tarefas FOR UPDATE USING (public.is_staff());