-- 1. Colunas de vínculo
ALTER TABLE public.conta_propostas
  ADD COLUMN IF NOT EXISTS oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS oportunidade_proposta_id uuid;

ALTER TABLE public.oportunidade_propostas
  ADD COLUMN IF NOT EXISTS conta_proposta_id uuid;

CREATE INDEX IF NOT EXISTS conta_propostas_op_idx ON public.conta_propostas(oportunidade_id);
CREATE INDEX IF NOT EXISTS conta_propostas_op_prop_idx ON public.conta_propostas(oportunidade_proposta_id);
CREATE INDEX IF NOT EXISTS oportunidade_propostas_conta_prop_idx ON public.oportunidade_propostas(conta_proposta_id);

-- 2. Status unificados na proposta da conta
ALTER TABLE public.conta_propostas DROP CONSTRAINT IF EXISTS conta_propostas_status_check;
ALTER TABLE public.conta_propostas ADD CONSTRAINT conta_propostas_status_check
  CHECK (status = ANY (ARRAY['pendente','em_preparacao','enviada','em_analise','contraproposta','aceita','recusada','expirada','cancelada']));

-- 3. Espelhamento Oportunidade -> Conta
CREATE OR REPLACE FUNCTION public.sync_proposta_oportunidade_to_conta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_conta_prop uuid;
  v_conta uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.conta_proposta_id IS NOT NULL THEN
      DELETE FROM public.conta_propostas WHERE id = OLD.conta_proposta_id;
    END IF;
    RETURN NULL;
  END IF;

  v_conta := NEW.conta_id;
  IF v_conta IS NULL THEN
    SELECT o.conta_id INTO v_conta FROM public.oportunidades o WHERE o.id = NEW.oportunidade_id;
  END IF;
  IF v_conta IS NULL THEN
    RETURN NULL;
  END IF;

  IF NEW.conta_proposta_id IS NULL THEN
    INSERT INTO public.conta_propostas (
      conta_id, data_proposta, valor, status, descricao, imovel_id,
      oportunidade_id, oportunidade_proposta_id, created_by
    ) VALUES (
      v_conta, COALESCE(NEW.created_at::date, CURRENT_DATE), NEW.valor_proposto,
      NEW.status, NEW.observacoes, NEW.imovel_id,
      NEW.oportunidade_id, NEW.id, NEW.created_by
    ) RETURNING id INTO v_conta_prop;

    UPDATE public.oportunidade_propostas SET conta_proposta_id = v_conta_prop WHERE id = NEW.id;
  ELSE
    UPDATE public.conta_propostas cp SET
      valor = NEW.valor_proposto,
      status = NEW.status,
      descricao = NEW.observacoes,
      imovel_id = NEW.imovel_id,
      oportunidade_id = NEW.oportunidade_id,
      conta_id = v_conta
    WHERE cp.id = NEW.conta_proposta_id
      AND (cp.valor IS DISTINCT FROM NEW.valor_proposto
        OR cp.status IS DISTINCT FROM NEW.status
        OR cp.descricao IS DISTINCT FROM NEW.observacoes
        OR cp.imovel_id IS DISTINCT FROM NEW.imovel_id
        OR cp.oportunidade_id IS DISTINCT FROM NEW.oportunidade_id
        OR cp.conta_id IS DISTINCT FROM v_conta);
  END IF;

  RETURN NULL;
END;
$$;

-- 4. Espelhamento Conta -> Oportunidade
CREATE OR REPLACE FUNCTION public.sync_proposta_conta_to_oportunidade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_op_prop uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.oportunidade_proposta_id IS NOT NULL THEN
      DELETE FROM public.oportunidade_propostas WHERE id = OLD.oportunidade_proposta_id;
    END IF;
    RETURN NULL;
  END IF;

  IF NEW.oportunidade_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF NEW.oportunidade_proposta_id IS NULL THEN
    INSERT INTO public.oportunidade_propostas (
      oportunidade_id, conta_id, imovel_id, valor_proposto, observacoes,
      status, conta_proposta_id, created_by, created_at
    ) VALUES (
      NEW.oportunidade_id, NEW.conta_id, NEW.imovel_id, NEW.valor, NEW.descricao,
      CASE WHEN NEW.status = 'pendente' THEN 'em_analise' ELSE NEW.status END,
      NEW.id, NEW.created_by, COALESCE(NEW.created_at, now())
    ) RETURNING id INTO v_op_prop;

    UPDATE public.conta_propostas SET oportunidade_proposta_id = v_op_prop WHERE id = NEW.id;
  ELSE
    UPDATE public.oportunidade_propostas op SET
      valor_proposto = NEW.valor,
      observacoes = NEW.descricao,
      imovel_id = NEW.imovel_id,
      status = CASE WHEN NEW.status = 'pendente' THEN 'em_analise' ELSE NEW.status END,
      oportunidade_id = NEW.oportunidade_id,
      conta_id = NEW.conta_id
    WHERE op.id = NEW.oportunidade_proposta_id
      AND (op.valor_proposto IS DISTINCT FROM NEW.valor
        OR op.observacoes IS DISTINCT FROM NEW.descricao
        OR op.imovel_id IS DISTINCT FROM NEW.imovel_id
        OR op.status IS DISTINCT FROM (CASE WHEN NEW.status = 'pendente' THEN 'em_analise' ELSE NEW.status END)
        OR op.oportunidade_id IS DISTINCT FROM NEW.oportunidade_id
        OR op.conta_id IS DISTINCT FROM NEW.conta_id);
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_proposta_op_to_conta ON public.oportunidade_propostas;
CREATE TRIGGER trg_sync_proposta_op_to_conta
AFTER INSERT OR UPDATE OR DELETE ON public.oportunidade_propostas
FOR EACH ROW EXECUTE FUNCTION public.sync_proposta_oportunidade_to_conta();

DROP TRIGGER IF EXISTS trg_sync_proposta_conta_to_op ON public.conta_propostas;
CREATE TRIGGER trg_sync_proposta_conta_to_op
AFTER INSERT OR UPDATE OR DELETE ON public.conta_propostas
FOR EACH ROW EXECUTE FUNCTION public.sync_proposta_conta_to_oportunidade();

-- 5. Backfill: contas com exatamente uma oportunidade ativa
WITH ativa AS (
  SELECT conta_id, (array_agg(id))[1] AS op_id
  FROM public.oportunidades
  WHERE conta_id IS NOT NULL AND estagio NOT IN ('ganha','perdida')
  GROUP BY conta_id
  HAVING count(*) = 1
)
UPDATE public.conta_propostas cp
SET oportunidade_id = a.op_id
FROM ativa a
WHERE cp.conta_id = a.conta_id
  AND cp.oportunidade_id IS NULL
  AND cp.oportunidade_proposta_id IS NULL;