CREATE POLICY "Authenticated read originais" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'imoveis-originais');
CREATE POLICY "Authenticated upload originais" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'imoveis-originais');
CREATE POLICY "Authenticated update originais" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'imoveis-originais');
CREATE POLICY "Authenticated delete originais" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'imoveis-originais');