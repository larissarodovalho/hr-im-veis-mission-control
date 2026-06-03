DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;

CREATE POLICY "Public can read public site keys"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (key = 'images');

CREATE POLICY "Staff can read all site settings"
ON public.site_settings FOR SELECT
TO authenticated
USING (public.is_staff());