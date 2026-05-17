
-- Site settings table
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete site settings"
  ON public.site_settings FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public bucket for site assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read site-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site-assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());

CREATE POLICY "Admins can update site-assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-assets' AND public.is_admin());

CREATE POLICY "Admins can delete site-assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-assets' AND public.is_admin());
