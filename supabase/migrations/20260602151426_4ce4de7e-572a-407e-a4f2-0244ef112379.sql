CREATE TABLE public.meta_lead_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL,
  form_id text NOT NULL,
  form_nome text NOT NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  corretor_responsavel_id uuid,
  etapa_funil_inicial text NOT NULL DEFAULT 'novo',
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_lead_forms TO authenticated;
GRANT ALL ON public.meta_lead_forms TO service_role;

ALTER TABLE public.meta_lead_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees meta_lead_forms"
  ON public.meta_lead_forms FOR SELECT TO authenticated
  USING (is_staff());

CREATE POLICY "Admin/gestor insert meta_lead_forms"
  ON public.meta_lead_forms FOR INSERT TO authenticated
  WITH CHECK (is_admin() AND (created_by IS NULL OR created_by = auth.uid()));

CREATE POLICY "Admin/gestor update meta_lead_forms"
  ON public.meta_lead_forms FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "Admin only delete meta_lead_forms"
  ON public.meta_lead_forms FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_meta_lead_forms_updated_at
  BEFORE UPDATE ON public.meta_lead_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();