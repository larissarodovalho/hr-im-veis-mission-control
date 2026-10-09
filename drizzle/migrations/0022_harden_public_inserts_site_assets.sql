DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'active'
  AND length(email) BETWEEN 5 AND 254
  AND email ~* '^[a-z0-9._%+''-]+@[a-z0-9.-]+\.[a-z]{2,}$'
  AND (nome IS NULL OR (length(nome) <= 120 AND nome !~ '^[=+\-@]'))
  AND (telefone IS NULL OR length(telefone) <= 30)
);

DROP POLICY IF EXISTS "Anyone can insert site visits" ON public.site_visits;
CREATE POLICY "Anyone can insert site visits" ON public.site_visits
FOR INSERT TO anon, authenticated
WITH CHECK (
  left(path, 1) = '/' AND length(path) <= 500
  AND (referrer IS NULL OR length(referrer) <= 1000)
  AND (user_agent IS NULL OR length(user_agent) <= 500)
  AND (session_id IS NULL OR length(session_id) <= 100)
);

DROP POLICY IF EXISTS "Public can read site-assets" ON storage.objects;
CREATE POLICY "Admins can list site-assets" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'site-assets' AND public.is_admin());