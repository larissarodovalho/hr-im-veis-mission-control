DROP POLICY IF EXISTS "Admin only deletes reunioes" ON public.reunioes;
CREATE POLICY "Owner or admin/gestor deletes reunioes" ON public.reunioes FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR corretor_id = auth.uid() OR created_by = auth.uid());

DROP POLICY IF EXISTS "Admin only deletes ligacoes" ON public.ligacoes;
CREATE POLICY "Owner or admin/gestor deletes ligacoes" ON public.ligacoes FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR corretor_id = auth.uid() OR created_by = auth.uid());

DROP POLICY IF EXISTS "Admin/gestor deletes visitas" ON public.visitas;
CREATE POLICY "Owner or admin/gestor deletes visitas" ON public.visitas FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR corretor_id = auth.uid() OR created_by = auth.uid());