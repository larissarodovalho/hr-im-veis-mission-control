CREATE POLICY "Public visitors can view available imoveis"
ON public.imoveis
FOR SELECT
TO anon
USING (status = 'Disponível');