CREATE POLICY "Staff sees all ligacoes (agenda)"
ON public.ligacoes FOR SELECT TO authenticated
USING (public.is_staff());

CREATE POLICY "Staff sees all visitas (agenda)"
ON public.visitas FOR SELECT TO authenticated
USING (public.is_staff());

CREATE POLICY "Staff sees all captacoes (agenda)"
ON public.captacoes_imovel FOR SELECT TO authenticated
USING (public.is_staff());