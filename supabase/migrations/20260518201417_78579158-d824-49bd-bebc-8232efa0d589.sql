
ALTER TABLE public.propostas
  ADD COLUMN IF NOT EXISTS documento_url text,
  ADD COLUMN IF NOT EXISTS documento_nome text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('propostas', 'propostas', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Staff upload propostas"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'propostas' AND is_staff());

CREATE POLICY "Staff read propostas"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'propostas' AND is_staff());

CREATE POLICY "Staff update propostas"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'propostas' AND is_staff());

CREATE POLICY "Admin delete propostas"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'propostas' AND has_role(auth.uid(), 'admin'::app_role));
