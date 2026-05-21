
CREATE TABLE public.corretores_parceiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  email text,
  documento text,
  creci text,
  cidade text,
  estado text,
  comissao_padrao numeric(6,3),
  dados_bancarios text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.corretores_parceiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees corretores_parceiros"
ON public.corretores_parceiros FOR SELECT TO authenticated
USING (is_staff());

CREATE POLICY "Admin/gestor insert corretores_parceiros"
ON public.corretores_parceiros FOR INSERT TO authenticated
WITH CHECK (is_admin() AND auth.uid() = created_by);

CREATE POLICY "Admin/gestor update corretores_parceiros"
ON public.corretores_parceiros FOR UPDATE TO authenticated
USING (is_admin());

CREATE POLICY "Admin/gestor delete corretores_parceiros"
ON public.corretores_parceiros FOR DELETE TO authenticated
USING (is_admin());

CREATE TRIGGER trg_corretores_parceiros_updated
BEFORE UPDATE ON public.corretores_parceiros
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.contas
  ADD COLUMN parceiro_origem_id uuid REFERENCES public.corretores_parceiros(id) ON DELETE SET NULL;

CREATE INDEX idx_contas_parceiro_origem ON public.contas(parceiro_origem_id);
