
CREATE TABLE public.oportunidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_tipo TEXT NOT NULL CHECK (cliente_tipo IN ('lead','conta')),
  cliente_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao_busca TEXT,
  valor_alvo NUMERIC,
  tipo_imovel TEXT,
  cidade TEXT,
  bairro TEXT,
  estagio TEXT NOT NULL DEFAULT 'nova' CHECK (estagio IN ('nova','buscando','visita','proposta','ganha','perdida')),
  corretor_id UUID,
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta')),
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_oportunidades_estagio ON public.oportunidades(estagio);
CREATE INDEX idx_oportunidades_corretor ON public.oportunidades(corretor_id);
CREATE INDEX idx_oportunidades_cliente ON public.oportunidades(cliente_tipo, cliente_id);

ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees oportunidades" ON public.oportunidades
  FOR SELECT TO authenticated
  USING (is_staff());

CREATE POLICY "Staff creates oportunidades" ON public.oportunidades
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND is_staff());

CREATE POLICY "Owner or admin updates oportunidades" ON public.oportunidades
  FOR UPDATE TO authenticated
  USING (is_admin() OR corretor_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Admin deletes oportunidades" ON public.oportunidades
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_oportunidades_updated_at
BEFORE UPDATE ON public.oportunidades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.oportunidade_imoveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  oportunidade_id UUID NOT NULL,
  imovel_id UUID NOT NULL,
  interesse TEXT CHECK (interesse IN ('baixo','medio','alto')),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (oportunidade_id, imovel_id)
);

CREATE INDEX idx_oportunidade_imoveis_op ON public.oportunidade_imoveis(oportunidade_id);
CREATE INDEX idx_oportunidade_imoveis_im ON public.oportunidade_imoveis(imovel_id);

ALTER TABLE public.oportunidade_imoveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees oportunidade_imoveis" ON public.oportunidade_imoveis
  FOR SELECT TO authenticated
  USING (is_staff());

CREATE POLICY "Staff manages oportunidade_imoveis insert" ON public.oportunidade_imoveis
  FOR INSERT TO authenticated
  WITH CHECK (is_staff() AND EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = oportunidade_imoveis.oportunidade_id
      AND (is_admin() OR o.corretor_id = auth.uid() OR o.created_by = auth.uid())
  ));

CREATE POLICY "Staff manages oportunidade_imoveis update" ON public.oportunidade_imoveis
  FOR UPDATE TO authenticated
  USING (is_staff() AND EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = oportunidade_imoveis.oportunidade_id
      AND (is_admin() OR o.corretor_id = auth.uid() OR o.created_by = auth.uid())
  ));

CREATE POLICY "Staff manages oportunidade_imoveis delete" ON public.oportunidade_imoveis
  FOR DELETE TO authenticated
  USING (is_staff() AND EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = oportunidade_imoveis.oportunidade_id
      AND (is_admin() OR o.corretor_id = auth.uid() OR o.created_by = auth.uid())
  ));
