
-- Tabela de templates de contrato
CREATE TABLE public.contrato_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'autorizacao_venda_exclusividade',
  conteudo text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contrato_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff vê templates" ON public.contrato_templates
  FOR SELECT TO authenticated USING (is_staff());

CREATE POLICY "Admin/gestor insere templates" ON public.contrato_templates
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admin/gestor atualiza templates" ON public.contrato_templates
  FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admin deleta templates" ON public.contrato_templates
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_contrato_templates_updated_at
  BEFORE UPDATE ON public.contrato_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela principal de contratos
CREATE TABLE public.contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'autorizacao_venda_exclusividade',
  template_id uuid REFERENCES public.contrato_templates(id) ON DELETE SET NULL,
  lead_id uuid,
  conta_id uuid,
  imovel_id uuid,
  cliente_nome text,
  cliente_documento text,
  cliente_endereco text,
  cliente_email text,
  cliente_telefone text,
  valor numeric,
  comissao_percentual numeric DEFAULT 5,
  prazo_dias integer DEFAULT 365,
  data_inicio date,
  data_fim date,
  observacoes text,
  conteudo_renderizado text,
  pdf_url text,
  signed_document_id uuid,
  status text NOT NULL DEFAULT 'rascunho',
  corretor_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contratos_corretor ON public.contratos(corretor_id);
CREATE INDEX idx_contratos_lead ON public.contratos(lead_id);
CREATE INDEX idx_contratos_conta ON public.contratos(conta_id);
CREATE INDEX idx_contratos_imovel ON public.contratos(imovel_id);

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor vê todos contratos" ON public.contratos
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'gestor'::app_role));

CREATE POLICY "Corretor vê próprios contratos" ON public.contratos
  FOR SELECT TO authenticated
  USING (corretor_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Staff cria contratos" ON public.contratos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND is_staff());

CREATE POLICY "Dono ou admin atualiza contratos" ON public.contratos
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'gestor'::app_role) OR corretor_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Admin deleta contratos" ON public.contratos
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Template padrão (placeholder; usuário vai enviar o texto oficial)
INSERT INTO public.contrato_templates (nome, tipo, conteudo, ativo) VALUES (
  'Autorização de Venda com Exclusividade (padrão)',
  'autorizacao_venda_exclusividade',
  E'CONTRATO DE AUTORIZAÇÃO DE VENDA COM EXCLUSIVIDADE\n\nPelo presente instrumento, {{cliente_nome}}, inscrito(a) no CPF/CNPJ nº {{cliente_documento}}, residente em {{cliente_endereco}}, doravante denominado(a) PROPRIETÁRIO(A), autoriza com EXCLUSIVIDADE a HR IMÓVEIS, representada pelo(a) corretor(a) {{corretor_nome}}, a intermediar a venda do imóvel localizado em {{imovel_endereco}} (código {{imovel_codigo}}), pelo valor de R$ {{valor}}.\n\nA presente autorização vigora por {{prazo_dias}} dias, iniciando-se em {{data_inicio}} e encerrando-se em {{data_fim}}.\n\nA comissão devida à imobiliária pela intermediação é de {{comissao_percentual}}% sobre o valor de venda.\n\nObservações: {{observacoes}}\n\n{{cidade_data}}\n\n_____________________________________\n{{cliente_nome}} — Proprietário(a)\n\n_____________________________________\n{{corretor_nome}} — HR Imóveis',
  true
);
