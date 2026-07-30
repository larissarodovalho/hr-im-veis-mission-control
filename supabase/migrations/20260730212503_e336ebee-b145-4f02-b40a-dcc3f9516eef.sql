-- Trigger: criar card de captação quando a conta entra em captacao_imovel (legado)
-- OU quando recebe o destino comercial 'captacao_reuniao' (fluxo novo de Contato estabelecido)
CREATE OR REPLACE FUNCTION public.sync_captacao_from_conta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Criação: etapa legada captacao_imovel ou destino comercial captacao_reuniao
  IF (
    NEW.etapa_funil = 'captacao_imovel'
    AND (TG_OP = 'INSERT' OR OLD.etapa_funil IS DISTINCT FROM 'captacao_imovel')
  ) OR (
    NEW.destino_comercial = 'captacao_reuniao'
    AND (TG_OP = 'INSERT' OR OLD.destino_comercial IS DISTINCT FROM 'captacao_reuniao')
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.captacoes_imovel
      WHERE conta_id = NEW.id AND estagio <> 'concluido'
    ) THEN
      INSERT INTO public.captacoes_imovel (conta_id, estagio, responsavel_id, created_by)
      VALUES (NEW.id, 'novo', NEW.responsavel_id, COALESCE(NEW.responsavel_id, NEW.created_by));
    END IF;
  END IF;

  -- Reversão segura: destino saiu de captacao_reuniao → remove apenas cards intocados
  IF TG_OP = 'UPDATE'
    AND OLD.destino_comercial = 'captacao_reuniao'
    AND NEW.destino_comercial IS DISTINCT FROM 'captacao_reuniao'
  THEN
    DELETE FROM public.captacoes_imovel
    WHERE conta_id = NEW.id
      AND estagio = 'novo'
      AND data_agendada IS NULL
      AND checklist_enviado = false
      AND imovel_id IS NULL
      AND (observacoes IS NULL OR observacoes = '')
      AND (checklist_observacoes IS NULL OR checklist_observacoes = '');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_captacao_from_conta ON public.contas;
CREATE TRIGGER trg_sync_captacao_from_conta
AFTER INSERT OR UPDATE OF etapa_funil, destino_comercial ON public.contas
FOR EACH ROW EXECUTE FUNCTION public.sync_captacao_from_conta();

-- Backfill: contas já com destino captacao_reuniao sem captação ativa
INSERT INTO public.captacoes_imovel (conta_id, estagio, responsavel_id, created_by)
SELECT c.id, 'novo', c.responsavel_id, COALESCE(c.responsavel_id, c.created_by)
FROM public.contas c
WHERE c.destino_comercial = 'captacao_reuniao'
  AND NOT EXISTS (
    SELECT 1 FROM public.captacoes_imovel ci
    WHERE ci.conta_id = c.id AND ci.estagio <> 'concluido'
  );