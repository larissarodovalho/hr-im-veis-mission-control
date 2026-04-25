-- 1. Enriquecer leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS temperatura text CHECK (temperatura IN ('frio','morno','quente')),
  ADD COLUMN IF NOT EXISTS regiao text;

-- 2. CONTAS
CREATE TABLE public.contas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'PF' CHECK (tipo IN ('PF','PJ')),
  documento text,
  email text,
  telefone text,
  endereco text,
  observacoes text,
  tags text[] DEFAULT ARRAY[]::text[],
  lead_id_origem uuid,
  responsavel_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor see all contas" ON public.contas FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Corretor sees own contas" ON public.contas FOR SELECT TO authenticated
  USING (responsavel_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Authenticated creates contas" ON public.contas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin updates contas" ON public.contas FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR responsavel_id = auth.uid());
CREATE POLICY "Admin/gestor deletes contas" ON public.contas FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE TRIGGER contas_updated_at BEFORE UPDATE ON public.contas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_contas_responsavel ON public.contas(responsavel_id);
CREATE INDEX idx_contas_lead_origem ON public.contas(lead_id_origem);

-- 3. INTERACOES
CREATE TABLE public.interacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  conta_id uuid,
  tipo text NOT NULL CHECK (tipo IN ('ligacao','mensagem','visita','reuniao','email','nota')),
  resultado text,
  descricao text,
  proxima_acao text,
  agendado_para timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (lead_id IS NOT NULL OR conta_id IS NOT NULL)
);
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees interacoes" ON public.interacoes FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor')
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = interacoes.lead_id AND (l.corretor_id = auth.uid() OR l.created_by = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = interacoes.conta_id AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid()))
  );
CREATE POLICY "Authenticated creates interacoes" ON public.interacoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Author or admin updates interacoes" ON public.interacoes FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Author or admin deletes interacoes" ON public.interacoes FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE INDEX idx_interacoes_lead ON public.interacoes(lead_id, created_at DESC);
CREATE INDEX idx_interacoes_conta ON public.interacoes(conta_id, created_at DESC);

-- Atualiza ultima_interacao no lead automaticamente
CREATE OR REPLACE FUNCTION public.touch_lead_ultima_interacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE public.leads SET ultima_interacao = NEW.created_at WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER interacoes_touch_lead AFTER INSERT ON public.interacoes
  FOR EACH ROW EXECUTE FUNCTION public.touch_lead_ultima_interacao();

-- 4. REUNIOES
CREATE TABLE public.reunioes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  conta_id uuid,
  agendada_para timestamptz NOT NULL,
  local text,
  link text,
  status text NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada','realizada','no_show','cancelada')),
  notas text,
  corretor_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees reunioes" ON public.reunioes FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR corretor_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Authenticated creates reunioes" ON public.reunioes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin updates reunioes" ON public.reunioes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR corretor_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Admin/gestor deletes reunioes" ON public.reunioes FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE TRIGGER reunioes_updated_at BEFORE UPDATE ON public.reunioes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_reunioes_lead ON public.reunioes(lead_id);
CREATE INDEX idx_reunioes_agendada ON public.reunioes(agendada_para);

-- 5. LIGACOES
CREATE TABLE public.ligacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  conta_id uuid,
  data timestamptz NOT NULL DEFAULT now(),
  duracao_seg integer DEFAULT 0,
  resultado text CHECK (resultado IN ('atendeu','nao_atendeu','retornar','sem_interesse','interessado','agendou','outro')),
  gravacao_url text,
  notas text,
  corretor_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ligacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees ligacoes" ON public.ligacoes FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR corretor_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Authenticated creates ligacoes" ON public.ligacoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin updates ligacoes" ON public.ligacoes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR corretor_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Admin/gestor deletes ligacoes" ON public.ligacoes FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE INDEX idx_ligacoes_lead ON public.ligacoes(lead_id, data DESC);