-- Migra automaticamente o histórico de interações do lead para a conta criada a partir dele
CREATE OR REPLACE FUNCTION public.migrar_interacoes_para_conta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.lead_id_origem IS NOT NULL THEN
    UPDATE public.interacoes
    SET conta_id = NEW.id
    WHERE lead_id = NEW.lead_id_origem
      AND conta_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_migrar_interacoes_para_conta ON public.contas;
CREATE TRIGGER trg_migrar_interacoes_para_conta
AFTER INSERT ON public.contas
FOR EACH ROW
EXECUTE FUNCTION public.migrar_interacoes_para_conta();

-- Backfill: vincula interações órfãs de contas já convertidas
UPDATE public.interacoes i
SET conta_id = c.id
FROM public.contas c
WHERE c.lead_id_origem = i.lead_id
  AND i.conta_id IS NULL;