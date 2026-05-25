
-- Tabela de captações de imóveis
CREATE TABLE public.captacoes_imovel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL,
  estagio text NOT NULL DEFAULT 'novo',
  data_agendada timestamptz,
  checklist_enviado boolean NOT NULL DEFAULT false,
  checklist_observacoes text,
  imovel_id uuid,
  responsavel_id uuid,
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_captacoes_conta ON public.captacoes_imovel(conta_id);
CREATE INDEX idx_captacoes_estagio ON public.captacoes_imovel(estagio);

ALTER TABLE public.captacoes_imovel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees captacoes"
ON public.captacoes_imovel FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'marketing'::app_role)
  OR responsavel_id = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM contas c WHERE c.id = captacoes_imovel.conta_id AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid()))
);

CREATE POLICY "Staff insert captacoes"
ON public.captacoes_imovel FOR INSERT TO authenticated
WITH CHECK (is_staff() AND (created_by IS NULL OR created_by = auth.uid()));

CREATE POLICY "Owner or admin updates captacoes"
ON public.captacoes_imovel FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'marketing'::app_role)
  OR responsavel_id = auth.uid()
  OR created_by = auth.uid()
);

CREATE POLICY "Admin deletes captacoes"
ON public.captacoes_imovel FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full captacoes"
ON public.captacoes_imovel FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE TRIGGER update_captacoes_imovel_updated_at
BEFORE UPDATE ON public.captacoes_imovel
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para sincronizar contas em etapa captacao_imovel
CREATE OR REPLACE FUNCTION public.sync_captacao_from_conta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.etapa_funil = 'captacao_imovel' AND (TG_OP = 'INSERT' OR OLD.etapa_funil IS DISTINCT FROM 'captacao_imovel') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.captacoes_imovel
      WHERE conta_id = NEW.id AND estagio <> 'concluido'
    ) THEN
      INSERT INTO public.captacoes_imovel (conta_id, estagio, responsavel_id, created_by)
      VALUES (NEW.id, 'novo', NEW.responsavel_id, COALESCE(NEW.responsavel_id, NEW.created_by));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_captacao_from_conta
AFTER INSERT OR UPDATE OF etapa_funil ON public.contas
FOR EACH ROW EXECUTE FUNCTION public.sync_captacao_from_conta();

-- Backfill: criar cards para contas atualmente em captacao_imovel sem captação ativa
INSERT INTO public.captacoes_imovel (conta_id, estagio, responsavel_id, created_by)
SELECT c.id, 'novo', c.responsavel_id, COALESCE(c.responsavel_id, c.created_by)
FROM public.contas c
WHERE c.etapa_funil = 'captacao_imovel'
  AND NOT EXISTS (
    SELECT 1 FROM public.captacoes_imovel ci
    WHERE ci.conta_id = c.id AND ci.estagio <> 'concluido'
  );
