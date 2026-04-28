-- Campos extras em contas
ALTER TABLE public.contas
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS interesse text,
  ADD COLUMN IF NOT EXISTS is_partner boolean NOT NULL DEFAULT false;

-- Tabela de propriedades vinculadas a uma conta
CREATE TABLE IF NOT EXISTS public.conta_propriedades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_id uuid NOT NULL,
  operacao text,
  aptidao text,
  nome_fazenda text,
  regiao text,
  tamanho_ha numeric,
  valor_negocio numeric,
  valor_comissao numeric,
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conta_propriedades_conta ON public.conta_propriedades(conta_id);

ALTER TABLE public.conta_propriedades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees conta_propriedades"
  ON public.conta_propriedades FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.contas c
      WHERE c.id = conta_propriedades.conta_id
        AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid())
    )
  );

CREATE POLICY "Authenticated insert conta_propriedades"
  ON public.conta_propriedades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin updates conta_propriedades"
  ON public.conta_propriedades FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.contas c
      WHERE c.id = conta_propriedades.conta_id AND c.responsavel_id = auth.uid()
    )
  );

CREATE POLICY "Admin/gestor deletes conta_propriedades"
  ON public.conta_propriedades FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE TRIGGER update_conta_propriedades_updated_at
  BEFORE UPDATE ON public.conta_propriedades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();