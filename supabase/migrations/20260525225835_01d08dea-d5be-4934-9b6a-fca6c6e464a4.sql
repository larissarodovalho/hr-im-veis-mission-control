
-- 1) Colunas de exclusividade
ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS exclusividade_inicio date,
  ADD COLUMN IF NOT EXISTS exclusividade_fim date,
  ADD COLUMN IF NOT EXISTS exclusividade_observacoes text;

-- 2) Tabela de documentos do imóvel
CREATE TABLE IF NOT EXISTS public.imovel_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id uuid NOT NULL,
  nome text NOT NULL,
  storage_path text NOT NULL,
  tamanho_bytes bigint,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imovel_documentos_imovel ON public.imovel_documentos(imovel_id);

ALTER TABLE public.imovel_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees imovel_documentos"
  ON public.imovel_documentos FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'marketing'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.imoveis i
      WHERE i.id = imovel_documentos.imovel_id
        AND (i.corretor_id = auth.uid() OR i.created_by = auth.uid())
    )
  );

CREATE POLICY "Staff insert imovel_documentos"
  ON public.imovel_documentos FOR INSERT TO authenticated
  WITH CHECK (
    is_staff()
    AND (created_by IS NULL OR created_by = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.imoveis i
      WHERE i.id = imovel_documentos.imovel_id
        AND (
          has_role(auth.uid(), 'admin'::app_role)
          OR has_role(auth.uid(), 'gestor'::app_role)
          OR has_role(auth.uid(), 'marketing'::app_role)
          OR i.corretor_id = auth.uid()
          OR i.created_by = auth.uid()
        )
    )
  );

CREATE POLICY "Admin deletes imovel_documentos"
  ON public.imovel_documentos FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR created_by = auth.uid()
  );

-- 3) Bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('imoveis-docs', 'imoveis-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 4) Storage policies
CREATE POLICY "Staff read imoveis-docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'imoveis-docs'
    AND is_staff()
  );

CREATE POLICY "Staff upload imoveis-docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'imoveis-docs'
    AND is_staff()
  );

CREATE POLICY "Staff update imoveis-docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'imoveis-docs' AND is_staff());

CREATE POLICY "Staff delete imoveis-docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'imoveis-docs'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'gestor'::app_role)
    )
  );
