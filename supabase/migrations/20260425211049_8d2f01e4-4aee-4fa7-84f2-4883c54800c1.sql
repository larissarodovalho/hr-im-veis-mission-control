-- Refazer políticas de conteudo_posts (sem FOR ALL com USING true)
DROP POLICY IF EXISTS "Admin/gestor manage conteudo" ON public.conteudo_posts;

CREATE POLICY "Admin/gestor select conteudo"
  ON public.conteudo_posts FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE POLICY "Admin/gestor insert conteudo"
  ON public.conteudo_posts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'))
  );

CREATE POLICY "Admin/gestor update conteudo"
  ON public.conteudo_posts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE POLICY "Admin/gestor delete conteudo"
  ON public.conteudo_posts FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

-- Refazer políticas de campanhas_trafego
DROP POLICY IF EXISTS "Admin/gestor manage campanhas" ON public.campanhas_trafego;

CREATE POLICY "Admin/gestor select campanhas"
  ON public.campanhas_trafego FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE POLICY "Admin/gestor insert campanhas"
  ON public.campanhas_trafego FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'))
  );

CREATE POLICY "Admin/gestor update campanhas"
  ON public.campanhas_trafego FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE POLICY "Admin/gestor delete campanhas"
  ON public.campanhas_trafego FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

-- Restringir listing do bucket público de imóveis (SELECT na tabela storage.objects)
-- Imagens individuais continuam acessíveis via URL pública direta.
DROP POLICY IF EXISTS "Public can view imovel photos" ON storage.objects;

CREATE POLICY "Staff can list imovel photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'imoveis' AND (
      has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'corretor')
    )
  );