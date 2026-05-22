
CREATE TABLE public.meta_ads_imoveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id text NOT NULL UNIQUE,
  imovel_id uuid NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  nome_anuncio text,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_meta_ads_imoveis_ad_id ON public.meta_ads_imoveis(ad_id);
CREATE INDEX idx_meta_ads_imoveis_imovel ON public.meta_ads_imoveis(imovel_id);

ALTER TABLE public.meta_ads_imoveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees meta_ads_imoveis" ON public.meta_ads_imoveis
  FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "Admin/gestor insert meta_ads_imoveis" ON public.meta_ads_imoveis
  FOR INSERT TO authenticated WITH CHECK (is_admin() AND auth.uid() = created_by);
CREATE POLICY "Admin/gestor update meta_ads_imoveis" ON public.meta_ads_imoveis
  FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admin deletes meta_ads_imoveis" ON public.meta_ads_imoveis
  FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "Service role full meta_ads_imoveis" ON public.meta_ads_imoveis
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_meta_ads_imoveis_updated_at
  BEFORE UPDATE ON public.meta_ads_imoveis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.meta_ads_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id text,
  title text,
  body text,
  source_url text,
  thumbnail_url text,
  conversation_id uuid,
  lead_id uuid,
  imovel_id_resolvido uuid REFERENCES public.imoveis(id) ON DELETE SET NULL,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_meta_ads_referrals_ad_id ON public.meta_ads_referrals(ad_id);
CREATE INDEX idx_meta_ads_referrals_created ON public.meta_ads_referrals(created_at DESC);

ALTER TABLE public.meta_ads_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor sees meta_ads_referrals" ON public.meta_ads_referrals
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Service role full meta_ads_referrals" ON public.meta_ads_referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);
