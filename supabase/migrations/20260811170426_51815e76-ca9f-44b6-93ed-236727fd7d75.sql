-- ============ OPERAÇÕES ============
CREATE TABLE public.carteira_operacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  modo text NOT NULL DEFAULT 'automatico' CHECK (modo IN ('automatico','manual','automatico_ajuste')),
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','em_revisao','confirmada','cancelada')),
  filtros jsonb NOT NULL DEFAULT '{}'::jsonb,
  gestor_id uuid NOT NULL,
  total_definido integer NOT NULL DEFAULT 0,
  total_selecionado integer NOT NULL DEFAULT 0,
  geracoes_automaticas integer NOT NULL DEFAULT 0,
  ajustes_manuais integer NOT NULL DEFAULT 0,
  observacoes text,
  confirmada_em timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carteira_operacoes TO authenticated;
GRANT ALL ON public.carteira_operacoes TO service_role;
ALTER TABLE public.carteira_operacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/gestor gerencia operacoes" ON public.carteira_operacoes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ LOTES ============
CREATE TABLE public.carteira_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operacao_id uuid NOT NULL REFERENCES public.carteira_operacoes(id) ON DELETE CASCADE,
  numero integer NOT NULL DEFAULT 1,
  nome text NOT NULL,
  corretor_id uuid NOT NULL,
  gestor_id uuid NOT NULL,
  modo text NOT NULL DEFAULT 'automatico' CHECK (modo IN ('automatico','manual','automatico_ajuste')),
  quantidade_definida integer NOT NULL DEFAULT 0,
  quantidade_inicial integer NOT NULL DEFAULT 0,
  prazo_primeiro_contato_dias integer NOT NULL DEFAULT 3,
  objetivo text,
  observacoes_internas text,
  filtros jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado','em_revisao','ativo','em_andamento','concluido','cancelado')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_carteira_lotes_operacao ON public.carteira_lotes(operacao_id);
CREATE INDEX idx_carteira_lotes_corretor ON public.carteira_lotes(corretor_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carteira_lotes TO authenticated;
GRANT ALL ON public.carteira_lotes TO service_role;
ALTER TABLE public.carteira_lotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/gestor gerencia lotes" ON public.carteira_lotes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Corretor ve proprios lotes" ON public.carteira_lotes FOR SELECT TO authenticated
  USING (corretor_id = auth.uid());

-- ============ ATRIBUIÇÕES ============
CREATE TABLE public.carteira_atribuicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL REFERENCES public.contas(id) ON DELETE CASCADE,
  lote_id uuid REFERENCES public.carteira_lotes(id) ON DELETE SET NULL,
  operacao_id uuid REFERENCES public.carteira_operacoes(id) ON DELETE SET NULL,
  lote_origem_id uuid,
  modo_selecao text,
  corretor_original_id uuid NOT NULL,
  corretor_id uuid NOT NULL,
  gestor_id uuid,
  atribuida_em timestamptz NOT NULL DEFAULT now(),
  prazo_primeiro_contato timestamptz,
  primeira_atividade_em timestamptz,
  contato_estabelecido_em timestamptz,
  ultima_atividade_em timestamptz,
  tentativas integer NOT NULL DEFAULT 0,
  proxima_acao text,
  proxima_acao_em timestamptz,
  status text NOT NULL DEFAULT 'primeiro_contato_pendente',
  resultado text,
  oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  encerrada_em timestamptz,
  motivo_encerramento text,
  motivo_devolucao text,
  motivo_transferencia text,
  solicitacao_tipo text CHECK (solicitacao_tipo IS NULL OR solicitacao_tipo IN ('devolucao','transferencia')),
  solicitacao_motivo text,
  solicitacao_em timestamptz,
  observacoes_internas text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX carteira_atribuicoes_conta_ativa ON public.carteira_atribuicoes(conta_id) WHERE encerrada_em IS NULL;
CREATE INDEX idx_carteira_atrib_lote ON public.carteira_atribuicoes(lote_id);
CREATE INDEX idx_carteira_atrib_corretor ON public.carteira_atribuicoes(corretor_id);
CREATE INDEX idx_carteira_atrib_original ON public.carteira_atribuicoes(corretor_original_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carteira_atribuicoes TO authenticated;
GRANT ALL ON public.carteira_atribuicoes TO service_role;
ALTER TABLE public.carteira_atribuicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/gestor gerencia atribuicoes" ON public.carteira_atribuicoes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Corretor ve proprias atribuicoes" ON public.carteira_atribuicoes FOR SELECT TO authenticated
  USING (corretor_id = auth.uid() OR corretor_original_id = auth.uid());

-- ============ EVENTOS (histórico imutável) ============
CREATE TABLE public.carteira_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atribuicao_id uuid REFERENCES public.carteira_atribuicoes(id) ON DELETE CASCADE,
  operacao_id uuid REFERENCES public.carteira_operacoes(id) ON DELETE SET NULL,
  conta_id uuid,
  lote_id uuid,
  lote_anterior_id uuid,
  lote_novo_id uuid,
  tipo text NOT NULL,
  responsavel_anterior_id uuid,
  responsavel_novo_id uuid,
  gestor_id uuid,
  status_anterior text,
  status_novo text,
  motivo text,
  observacao text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_carteira_eventos_atrib ON public.carteira_eventos(atribuicao_id, created_at DESC);
CREATE INDEX idx_carteira_eventos_conta ON public.carteira_eventos(conta_id, created_at DESC);
GRANT SELECT, INSERT ON public.carteira_eventos TO authenticated;
GRANT ALL ON public.carteira_eventos TO service_role;
ALTER TABLE public.carteira_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/gestor ve eventos" ON public.carteira_eventos FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "Corretor ve eventos das proprias atribuicoes" ON public.carteira_eventos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.carteira_atribuicoes a
                  WHERE a.id = carteira_eventos.atribuicao_id
                    AND (a.corretor_id = auth.uid() OR a.corretor_original_id = auth.uid())));
CREATE POLICY "Staff registra eventos" ON public.carteira_eventos FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND created_by = auth.uid());

-- ============ SELEÇÃO PROVISÓRIA ============
CREATE TABLE public.carteira_selecao_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operacao_id uuid NOT NULL REFERENCES public.carteira_operacoes(id) ON DELETE CASCADE,
  lote_id uuid NOT NULL REFERENCES public.carteira_lotes(id) ON DELETE CASCADE,
  conta_id uuid NOT NULL REFERENCES public.contas(id) ON DELETE CASCADE,
  origem text NOT NULL DEFAULT 'automatica' CHECK (origem IN ('automatica','manual','substituicao')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (operacao_id, conta_id)
);
CREATE INDEX idx_carteira_selecao_lote ON public.carteira_selecao_itens(lote_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carteira_selecao_itens TO authenticated;
GRANT ALL ON public.carteira_selecao_itens TO service_role;
ALTER TABLE public.carteira_selecao_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/gestor gerencia selecao" ON public.carteira_selecao_itens FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ VÍNCULOS EM MÓDULOS EXISTENTES ============
ALTER TABLE public.oportunidades
  ADD COLUMN IF NOT EXISTS atribuicao_id uuid REFERENCES public.carteira_atribuicoes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lote_id uuid REFERENCES public.carteira_lotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS operacao_id uuid REFERENCES public.carteira_operacoes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS corretor_original_id uuid,
  ADD COLUMN IF NOT EXISTS corretor_gerador_id uuid;

ALTER TABLE public.interacoes
  ADD COLUMN IF NOT EXISTS atribuicao_id uuid REFERENCES public.carteira_atribuicoes(id) ON DELETE SET NULL;

-- ============ TRIGGERS updated_at ============
CREATE TRIGGER trg_carteira_operacoes_updated BEFORE UPDATE ON public.carteira_operacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_carteira_lotes_updated BEFORE UPDATE ON public.carteira_lotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_carteira_atribuicoes_updated BEFORE UPDATE ON public.carteira_atribuicoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();