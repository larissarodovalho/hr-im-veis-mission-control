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

  SELECT id INTO v_op_prop FROM public.oportunidade_propostas WHERE conta_proposta_id = NEW.id LIMIT 1;
  v_op_prop := COALESCE(NEW.oportunidade_proposta_id, v_op_prop);

  IF v_op_prop IS NULL THEN
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
    IF NEW.oportunidade_proposta_id IS DISTINCT FROM v_op_prop THEN
      UPDATE public.conta_propostas SET oportunidade_proposta_id = v_op_prop WHERE id = NEW.id;
    END IF;
    UPDATE public.oportunidade_propostas op SET
      valor_proposto = NEW.valor,
      observacoes = NEW.descricao,
      imovel_id = NEW.imovel_id,
      status = CASE WHEN NEW.status = 'pendente' THEN 'em_analise' ELSE NEW.status END,
      oportunidade_id = NEW.oportunidade_id,
      conta_id = NEW.conta_id
    WHERE op.id = v_op_prop
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

  SELECT id INTO v_conta_prop FROM public.conta_propostas WHERE oportunidade_proposta_id = NEW.id LIMIT 1;
  v_conta_prop := COALESCE(NEW.conta_proposta_id, v_conta_prop);

  IF v_conta_prop IS NULL THEN
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
    IF NEW.conta_proposta_id IS DISTINCT FROM v_conta_prop THEN
      UPDATE public.oportunidade_propostas SET conta_proposta_id = v_conta_prop WHERE id = NEW.id;
    END IF;
    UPDATE public.conta_propostas cp SET
      valor = NEW.valor_proposto,
      status = NEW.status,
      descricao = NEW.observacoes,
      imovel_id = NEW.imovel_id,
      oportunidade_id = NEW.oportunidade_id,
      conta_id = v_conta
    WHERE cp.id = v_conta_prop
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