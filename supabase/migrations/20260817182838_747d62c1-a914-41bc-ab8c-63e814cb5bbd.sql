-- Etapa 13: visibilidade dos links por papel
DROP POLICY IF EXISTS "Staff read links" ON public.imovel_links_compartilhados;
CREATE POLICY "Links visiveis por papel"
ON public.imovel_links_compartilhados
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'marketing'::app_role)
  OR corretor_id = auth.uid()
  OR created_by = auth.uid()
);

DROP POLICY IF EXISTS "Staff read link eventos" ON public.imovel_link_eventos;
CREATE POLICY "Eventos visiveis conforme link"
ON public.imovel_link_eventos
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.imovel_links_compartilhados l
  WHERE l.id = imovel_link_eventos.link_id
));

DROP POLICY IF EXISTS "Staff manage link itens" ON public.imovel_link_itens;
CREATE POLICY "Itens visiveis conforme link"
ON public.imovel_link_itens
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.imovel_links_compartilhados l
  WHERE l.id = imovel_link_itens.link_id
));
CREATE POLICY "Staff gerencia itens de link"
ON public.imovel_link_itens
FOR ALL
TO authenticated
USING (is_staff())
WITH CHECK (is_staff());