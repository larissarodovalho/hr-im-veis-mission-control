CREATE POLICY "Secretaria sees ligacoes" ON public.ligacoes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'secretaria'::app_role));

CREATE POLICY "Secretaria sees visitas" ON public.visitas
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'secretaria'::app_role));

CREATE POLICY "Secretaria sees captacoes" ON public.captacoes_imovel
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'secretaria'::app_role));

CREATE POLICY "Secretaria sees leads" ON public.leads
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'secretaria'::app_role));

CREATE POLICY "Secretaria sees contas" ON public.contas
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'secretaria'::app_role));