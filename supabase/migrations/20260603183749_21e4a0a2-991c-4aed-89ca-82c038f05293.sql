DROP POLICY IF EXISTS "signed-docs read staff or owner" ON storage.objects;

CREATE POLICY "signed-docs read scoped"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signed-documents'
  AND (
    is_admin()
    OR owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.signed_documents sd
      WHERE sd.id::text = split_part(storage.objects.name, '/', 2)
        AND (
          sd.file_url = storage.objects.name
          OR sd.signed_file_url = storage.objects.name
        )
    )
  )
);