ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS contrato_pdf_path text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos-vendas', 'contratos-vendas', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Staff read contratos-vendas" ON storage.objects FOR SELECT
USING (bucket_id = 'contratos-vendas' AND public.is_staff());

CREATE POLICY "Staff upload contratos-vendas" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contratos-vendas' AND public.is_staff());

CREATE POLICY "Staff update contratos-vendas" ON storage.objects FOR UPDATE
USING (bucket_id = 'contratos-vendas' AND public.is_staff());

CREATE POLICY "Admin delete contratos-vendas" ON storage.objects FOR DELETE
USING (bucket_id = 'contratos-vendas' AND public.is_admin());