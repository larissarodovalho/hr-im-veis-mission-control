CREATE TABLE public.metas_vgv (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretor_id uuid NOT NULL,
  ano integer NOT NULL,
  meta_vgv numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (corretor_id, ano)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas_vgv TO authenticated;
GRANT ALL ON public.metas_vgv TO service_role;
ALTER TABLE public.metas_vgv ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff le metas" ON public.metas_vgv FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Admin insere metas" ON public.metas_vgv FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin altera metas" ON public.metas_vgv FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin exclui metas" ON public.metas_vgv FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_metas_vgv_updated BEFORE UPDATE ON public.metas_vgv FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER PUBLICATION supabase_realtime ADD TABLE public.metas_vgv;