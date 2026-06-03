
-- 1) Restrict imoveis base table SELECT to staff only (remove anon access)
DROP POLICY IF EXISTS "Public can view available imoveis" ON public.imoveis;

-- 2) Make imoveis_public view run with definer rights so anon can read it
--    without needing direct SELECT on the imoveis base table. The view's
--    WHERE clause already limits rows to published, available listings.
ALTER VIEW public.imoveis_public SET (security_invoker = false);
GRANT SELECT ON public.imoveis_public TO anon, authenticated;

-- 3) Tighten signed-documents storage SELECT to mirror the table RLS:
--    user must be admin, file owner, document creator, linked corretor on the lead,
--    or linked responsavel on the conta.
DROP POLICY IF EXISTS "signed-docs read scoped" ON storage.objects;

CREATE POLICY "signed-docs read scoped"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signed-documents'
  AND (
    is_admin()
    OR owner = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.signed_documents sd
      LEFT JOIN public.leads l ON l.id = sd.lead_id
      LEFT JOIN public.contas c ON c.id = sd.conta_id
      WHERE sd.id::text = split_part(storage.objects.name, '/', 2)
        AND (sd.file_url = storage.objects.name OR sd.signed_file_url = storage.objects.name)
        AND (
          sd.created_by = auth.uid()
          OR l.corretor_id = auth.uid()
          OR l.created_by = auth.uid()
          OR c.responsavel_id = auth.uid()
          OR c.created_by = auth.uid()
        )
    )
  )
);
