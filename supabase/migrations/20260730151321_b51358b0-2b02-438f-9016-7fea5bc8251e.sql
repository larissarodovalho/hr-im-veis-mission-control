-- ============ 1. Oportunidades: novas colunas (todas nullable, não destrutivo) ============
ALTER TABLE public.oportunidades
  ADD COLUMN IF NOT EXISTS conta_id uuid REFERENCES public.contas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_id_origem uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS categoria_origem text,
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS forma_pagamento text,
  ADD COLUMN IF NOT EXISTS prazo_pretendido text,
  ADD COLUMN IF NOT EXISTS possui_permuta boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS imovel_permuta text,
  ADD COLUMN IF NOT EXISTS valor_estimado_permuta numeric,
  ADD COLUMN IF NOT EXISTS caracteristicas_indispensaveis text,
  ADD COLUMN IF NOT EXISTS data_diagnostico timestamptz,
  ADD COLUMN IF NOT EXISTS diagnostico_por uuid,
  ADD COLUMN IF NOT EXISTS valor_final numeric,
  ADD COLUMN IF NOT EXISTS data_fechamento date,
  ADD COLUMN IF NOT EXISTS imovel_fechamento_id uuid REFERENCES public.imoveis(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proposta_aceita_id uuid,
  ADD COLUMN IF NOT EXISTS motivo_perda text,
  ADD COLUMN IF NOT EXISTS obs_perda text,
  ADD COLUMN IF NOT EXISTS destino_conta_perda text,
  ADD COLUMN IF NOT EXISTS encerrada_em timestamptz,
  ADD COLUMN IF NOT EXISTS encerrada_por uuid,
  ADD COLUMN IF NOT EXISTS estagio_desde timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.oportunidades DROP CONSTRAINT IF EXISTS oportunidades_categoria_origem_check;
ALTER TABLE public.oportunidades ADD CONSTRAINT oportunidades_categoria_origem_check
  CHECK (categoria_origem IS NULL OR categoria_origem IN ('carteira','marketing'));
ALTER TABLE public.oportunidades DROP CONSTRAINT IF EXISTS oportunidades_destino_conta_perda_check;
ALTER TABLE public.oportunidades ADD CONSTRAINT oportunidades_destino_conta_perda_check
  CHECK (destino_conta_perda IS NULL OR destino_conta_perda IN ('oportunidade_futura','continuar_relacionamento','contato_cancelado'));

CREATE INDEX IF NOT EXISTS oportunidades_conta_id_idx ON public.oportunidades(conta_id);
CREATE INDEX IF NOT EXISTS oportunidades_estagio_idx ON public.oportunidades(estagio);

-- Backfill dos vínculos a partir dos campos legados (cliente_tipo/cliente_id permanecem intactos)
UPDATE public.oportunidades o SET conta_id = o.cliente_id
  WHERE o.cliente_tipo = 'conta' AND o.conta_id IS NULL
    AND EXISTS (SELECT 1 FROM public.contas c WHERE c.id = o.cliente_id);
UPDATE public.oportunidades o SET lead_id_origem = o.cliente_id
  WHERE o.cliente_tipo = 'lead' AND o.lead_id_origem IS NULL
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = o.cliente_id);
-- Oportunidades ligadas só a lead: tenta casar com a conta convertida daquele lead
UPDATE public.oportunidades o SET conta_id = c.id
  FROM public.contas c
  WHERE o.conta_id IS NULL AND o.lead_id_origem IS NOT NULL AND c.lead_id_origem = o.lead_id_origem;
-- Snapshot da categoria de origem para oportunidades já vinculadas a contas
UPDATE public.oportunidades o SET categoria_origem = c.categoria, origem = COALESCE(o.origem, c.origem)
  FROM public.contas c
  WHERE o.conta_id = c.id AND o.categoria_origem IS NULL AND c.categoria IN ('carteira','marketing');
-- Aproxima o início da etapa atual pela última atualização do registro
UPDATE public.oportunidades SET estagio_desde = updated_at WHERE estagio_desde IS NULL;

-- ============ 2. oportunidade_imoveis: campos de apresentação/feedback ============
ALTER TABLE public.oportunidade_imoveis
  ADD COLUMN IF NOT EXISTS apresentado_em timestamptz,
  ADD COLUMN IF NOT EXISTS apresentado_por uuid,
  ADD COLUMN IF NOT EXISTS feedback_cliente text,
  ADD COLUMN IF NOT EXISTS motivo_rejeicao text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'vinculado',
  ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.oportunidade_imoveis DROP CONSTRAINT IF EXISTS oportunidade_imoveis_status_check;
ALTER TABLE public.oportunidade_imoveis ADD CONSTRAINT oportunidade_imoveis_status_check
  CHECK (status IN ('vinculado','apresentado','rejeitado'));

-- ============ 3. oportunidade_visitas ============
CREATE TABLE IF NOT EXISTS public.oportunidade_visitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES public.oportunidades(id) ON DELETE CASCADE,
  conta_id uuid REFERENCES public.contas(id) ON DELETE SET NULL,
  imovel_id uuid REFERENCES public.imoveis(id) ON DELETE SET NULL,
  data_visita timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'agendada',
  corretor_id uuid,
  local text,
  observacao text,
  interesse_cliente text,
  feedback text,
  pontos_positivos text,
  objeções text,
  proxima_acao text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.oportunidade_visitas DROP CONSTRAINT IF EXISTS oportunidade_visitas_status_check;
ALTER TABLE public.oportunidade_visitas ADD CONSTRAINT oportunidade_visitas_status_check
  CHECK (status IN ('agendada','confirmada','realizada','cancelada','reagendada','nao_compareceu'));
ALTER TABLE public.oportunidade_visitas DROP CONSTRAINT IF EXISTS oportunidade_visitas_interesse_check;
ALTER TABLE public.oportunidade_visitas ADD CONSTRAINT oportunidade_visitas_interesse_check
  CHECK (interesse_cliente IS NULL OR interesse_cliente IN ('baixo','medio','alto'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.oportunidade_visitas TO authenticated;
GRANT ALL ON public.oportunidade_visitas TO service_role;
ALTER TABLE public.oportunidade_visitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Oportunidade_visitas scoped read" ON public.oportunidade_visitas FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = oportunidade_visitas.oportunidade_id
      AND (o.corretor_id = auth.uid() OR o.created_by = auth.uid())));
CREATE POLICY "Oportunidade_visitas scoped insert" ON public.oportunidade_visitas FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = oportunidade_visitas.oportunidade_id
      AND (public.is_admin() OR o.corretor_id = auth.uid() OR o.created_by = auth.uid())));
CREATE POLICY "Oportunidade_visitas scoped update" ON public.oportunidade_visitas FOR UPDATE TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = oportunidade_visitas.oportunidade_id
      AND (o.corretor_id = auth.uid() OR o.created_by = auth.uid())));
CREATE POLICY "Oportunidade_visitas scoped delete" ON public.oportunidade_visitas FOR DELETE TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = oportunidade_visitas.oportunidade_id
      AND (o.corretor_id = auth.uid() OR o.created_by = auth.uid())));

DROP TRIGGER IF EXISTS update_oportunidade_visitas_updated_at ON public.oportunidade_visitas;
CREATE TRIGGER update_oportunidade_visitas_updated_at BEFORE UPDATE ON public.oportunidade_visitas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 4. oportunidade_propostas ============
CREATE TABLE IF NOT EXISTS public.oportunidade_propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES public.oportunidades(id) ON DELETE CASCADE,
  conta_id uuid REFERENCES public.contas(id) ON DELETE SET NULL,
  imovel_id uuid REFERENCES public.imoveis(id) ON DELETE SET NULL,
  valor_pedido numeric,
  valor_proposto numeric,
  forma_pagamento text,
  entrada numeric,
  parcelamento text,
  financiamento text,
  prazos text,
  condicoes text,
  validade date,
  possui_permuta boolean NOT NULL DEFAULT false,
  imovel_permuta text,
  valor_estimado_permuta numeric,
  observacoes text,
  status text NOT NULL DEFAULT 'em_preparacao',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.oportunidade_propostas DROP CONSTRAINT IF EXISTS oportunidade_propostas_status_check;
ALTER TABLE public.oportunidade_propostas ADD CONSTRAINT oportunidade_propostas_status_check
  CHECK (status IN ('em_preparacao','enviada','em_analise','contraproposta','aceita','recusada','expirada','cancelada'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.oportunidade_propostas TO authenticated;
GRANT ALL ON public.oportunidade_propostas TO service_role;
ALTER TABLE public.oportunidade_propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Oportunidade_propostas scoped read" ON public.oportunidade_propostas FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = oportunidade_propostas.oportunidade_id
      AND (o.corretor_id = auth.uid() OR o.created_by = auth.uid())));
CREATE POLICY "Oportunidade_propostas scoped insert" ON public.oportunidade_propostas FOR INSERT TO authenticated
  WITH CHECK (public.is_staff() AND EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = oportunidade_propostas.oportunidade_id
      AND (public.is_admin() OR o.corretor_id = auth.uid() OR o.created_by = auth.uid())));
CREATE POLICY "Oportunidade_propostas scoped update" ON public.oportunidade_propostas FOR UPDATE TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = oportunidade_propostas.oportunidade_id
      AND (o.corretor_id = auth.uid() OR o.created_by = auth.uid())));
CREATE POLICY "Oportunidade_propostas scoped delete" ON public.oportunidade_propostas FOR DELETE TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.id = oportunidade_propostas.oportunidade_id
      AND (o.corretor_id = auth.uid() OR o.created_by = auth.uid())));

DROP TRIGGER IF EXISTS update_oportunidade_propostas_updated_at ON public.oportunidade_propostas;
CREATE TRIGGER update_oportunidade_propostas_updated_at BEFORE UPDATE ON public.oportunidade_propostas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FK da proposta aceita (criada depois da tabela de propostas)
ALTER TABLE public.oportunidades DROP CONSTRAINT IF EXISTS oportunidades_proposta_aceita_fk;
ALTER TABLE public.oportunidades ADD CONSTRAINT oportunidades_proposta_aceita_fk
  FOREIGN KEY (proposta_aceita_id) REFERENCES public.oportunidade_propostas(id) ON DELETE SET NULL;

-- ============ 5. Vínculos com interações, tarefas e fechamentos ============
ALTER TABLE public.interacoes ADD COLUMN IF NOT EXISTS oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE CASCADE;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL;
ALTER TABLE public.conta_fechamentos ADD COLUMN IF NOT EXISTS oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS interacoes_oportunidade_id_idx ON public.interacoes(oportunidade_id);
CREATE INDEX IF NOT EXISTS tarefas_oportunidade_id_idx ON public.tarefas(oportunidade_id);

-- ============ 6. Histórico automático de mudança de etapa ============
CREATE OR REPLACE FUNCTION public.oportunidades_touch_estagio()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.estagio IS DISTINCT FROM OLD.estagio THEN
    NEW.estagio_desde := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS oportunidades_touch_estagio ON public.oportunidades;
CREATE TRIGGER oportunidades_touch_estagio BEFORE UPDATE ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.oportunidades_touch_estagio();

CREATE OR REPLACE FUNCTION public.log_oportunidade_estagio()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.estagio IS DISTINCT FROM OLD.estagio THEN
    INSERT INTO public.interacoes (conta_id, oportunidade_id, tipo, descricao, created_by)
    VALUES (
      NEW.conta_id,
      NEW.id,
      'nota',
      'Oportunidade "' || NEW.titulo || '" movida de "' || OLD.estagio || '" para "' || NEW.estagio || '"' ||
      CASE WHEN OLD.estagio_desde IS NOT NULL
        THEN ' após ' || to_char(now() - OLD.estagio_desde, 'DD "dias" HH24"h" MI"min"')
        ELSE '' END || '.',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS log_oportunidade_estagio ON public.oportunidades;
CREATE TRIGGER log_oportunidade_estagio AFTER UPDATE ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.log_oportunidade_estagio();

-- ============ 7. Migração idempotente das contas em etapas legadas ============
CREATE OR REPLACE FUNCTION public.migrar_contas_legadas_oportunidades()
RETURNS TABLE(migrada_conta_id uuid, conta_nome text, etapa_legada text, acao text, nova_oportunidade_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  v_op uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas admin/gestor pode executar a migração de legados';
  END IF;

  FOR r IN
    SELECT c.* FROM public.contas c
    WHERE c.etapa_funil IN ('visita','proposta','fechado')
      AND NOT EXISTS (
        SELECT 1 FROM public.oportunidades o
        WHERE o.conta_id = c.id AND o.observacoes ILIKE '%[migração legada]%'
      )
    ORDER BY c.created_at
  LOOP
    INSERT INTO public.oportunidades (
      cliente_tipo, cliente_id, conta_id, lead_id_origem, categoria_origem, origem,
      titulo, corretor_id, prioridade, estagio, estagio_desde, observacoes, created_by, created_at
    ) VALUES (
      'conta', r.id, r.id, r.lead_id_origem,
      CASE WHEN r.categoria IN ('carteira','marketing') THEN r.categoria ELSE NULL END,
      r.origem,
      'Oportunidade — ' || r.nome,
      r.responsavel_id, 'media',
      CASE r.etapa_funil WHEN 'visita' THEN 'visita' WHEN 'proposta' THEN 'proposta' ELSE 'ganha' END,
      now(),
      '[migração legada] Criada a partir da conta na etapa legada "' || r.etapa_funil || '". Revisar dados do diagnóstico.',
      COALESCE(r.responsavel_id, auth.uid()), r.created_at
    ) RETURNING id INTO v_op;

    INSERT INTO public.interacoes (conta_id, oportunidade_id, tipo, descricao, created_by)
    VALUES (r.id, v_op, 'nota',
      'Oportunidade criada pela migração da etapa legada "' || r.etapa_funil || '" para o módulo de Oportunidades de Negócio.',
      auth.uid());

    IF r.etapa_funil = 'fechado' THEN
      UPDATE public.conta_fechamentos f SET oportunidade_id = v_op
      WHERE f.conta_id = r.id AND f.oportunidade_id IS NULL;
    END IF;

    migrada_conta_id := r.id;
    conta_nome := r.nome;
    etapa_legada := r.etapa_funil;
    acao := 'oportunidade_criada';
    nova_oportunidade_id := v_op;
    RETURN NEXT;
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.migrar_contas_legadas_oportunidades() TO authenticated;