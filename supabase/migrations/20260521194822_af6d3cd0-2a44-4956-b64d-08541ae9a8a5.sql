
CREATE TABLE public.vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id uuid REFERENCES public.imoveis(id) ON DELETE SET NULL,
  proposta_id uuid REFERENCES public.propostas(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  conta_id uuid REFERENCES public.contas(id) ON DELETE SET NULL,
  cliente_nome text NOT NULL,
  corretor_id uuid,
  valor_venda numeric(14,2) NOT NULL DEFAULT 0,
  valor_comissao numeric(14,2) NOT NULL DEFAULT 0,
  percentual_comissao numeric(6,3),
  tipo text NOT NULL DEFAULT 'Venda',
  status_pagamento text NOT NULL DEFAULT 'Pagamento pendente',
  origem text,
  data_venda timestamptz NOT NULL DEFAULT now(),
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendas_imovel ON public.vendas(imovel_id);
CREATE INDEX idx_vendas_corretor ON public.vendas(corretor_id);
CREATE INDEX idx_vendas_data ON public.vendas(data_venda DESC);

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor sees all vendas"
ON public.vendas FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Corretor sees own vendas"
ON public.vendas FOR SELECT TO authenticated
USING (corretor_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Admin/gestor insert vendas"
ON public.vendas FOR INSERT TO authenticated
WITH CHECK (is_admin() AND auth.uid() = created_by);

CREATE POLICY "Admin/gestor update vendas"
ON public.vendas FOR UPDATE TO authenticated
USING (is_admin());

CREATE POLICY "Admin/gestor delete vendas"
ON public.vendas FOR DELETE TO authenticated
USING (is_admin());

CREATE TRIGGER trg_vendas_updated
BEFORE UPDATE ON public.vendas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
