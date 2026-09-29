ALTER TABLE public.metas_vgv ADD COLUMN IF NOT EXISTS peso numeric NOT NULL DEFAULT 0;
ALTER TABLE public.metas_institucionais ADD COLUMN IF NOT EXISTS peso numeric NOT NULL DEFAULT 0;

CREATE TABLE public.metas_vgv_ano (
  ano integer PRIMARY KEY,
  meta_total numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas_vgv_ano TO authenticated;
GRANT ALL ON public.metas_vgv_ano TO service_role;
ALTER TABLE public.metas_vgv_ano ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff le metas ano" ON public.metas_vgv_ano FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "admin escreve metas ano" ON public.metas_vgv_ano FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.metas_vgv_vagas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano integer NOT NULL,
  rotulo text NOT NULL DEFAULT 'Novo corretor',
  peso numeric NOT NULL DEFAULT 0,
  meta_vgv numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas_vgv_vagas TO authenticated;
GRANT ALL ON public.metas_vgv_vagas TO service_role;
ALTER TABLE public.metas_vgv_vagas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff le vagas" ON public.metas_vgv_vagas FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "admin escreve vagas" ON public.metas_vgv_vagas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.metas_vgv_ano, public.metas_vgv_vagas;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.metas_institucionais;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;