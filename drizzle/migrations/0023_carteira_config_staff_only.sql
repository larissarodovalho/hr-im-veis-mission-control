DROP POLICY IF EXISTS carteira_config_select ON public.carteira_config;
CREATE POLICY carteira_config_select ON public.carteira_config FOR SELECT TO authenticated USING (public.is_staff());