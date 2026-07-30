ALTER TABLE public.contas
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS data_entrada_carteira timestamptz,
  ADD COLUMN IF NOT EXISTS destino_comercial text,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text,
  ADD COLUMN IF NOT EXISTS cancelado_em timestamptz,
  ADD COLUMN IF NOT EXISTS cancelado_por uuid;

ALTER TABLE public.contas DROP CONSTRAINT IF EXISTS contas_categoria_check;
ALTER TABLE public.contas ADD CONSTRAINT contas_categoria_check
  CHECK (categoria IS NULL OR categoria IN ('carteira','marketing'));

ALTER TABLE public.contas DROP CONSTRAINT IF EXISTS contas_destino_comercial_check;
ALTER TABLE public.contas ADD CONSTRAINT contas_destino_comercial_check
  CHECK (destino_comercial IS NULL OR destino_comercial IN ('captacao_reuniao','comprar_oportunidade','vender_hrx_producoes','oportunidade_futura'));

-- Backfill da categoria principal a partir das tags (contas com as duas tags ficam pendentes de revisão)
UPDATE public.contas
SET categoria = 'carteira'
WHERE categoria IS NULL
  AND tags @> '{carteira}'
  AND NOT tags @> '{marketing}';

UPDATE public.contas
SET categoria = 'marketing'
WHERE categoria IS NULL
  AND tags @> '{marketing}'
  AND NOT tags @> '{carteira}';

-- Data de entrada na carteira = data de criação do cadastro, quando não informada
UPDATE public.contas
SET data_entrada_carteira = created_at
WHERE categoria = 'carteira' AND data_entrada_carteira IS NULL;

-- Migração da etapa legada "Parceiros": vira característica da conta (is_partner) e vai para Contato estabelecido
INSERT INTO public.interacoes (conta_id, tipo, descricao, created_by)
SELECT id,
       'nota',
       'Etapa alterada de "Parceiros" (etapa legada) para "Contato estabelecido" na reestruturação do funil de Contas. Conta marcada como Parceiro.',
       NULL
FROM public.contas
WHERE etapa_funil = 'parceiros';

UPDATE public.contas
SET is_partner = true,
    etapa_funil = 'contato_estabelecido'
WHERE etapa_funil = 'parceiros';

-- Histórico automático de movimentação de etapa e categoria
CREATE OR REPLACE FUNCTION public.log_conta_movimentacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.etapa_funil IS DISTINCT FROM OLD.etapa_funil THEN
    INSERT INTO public.interacoes (conta_id, tipo, descricao, created_by)
    VALUES (
      NEW.id,
      'nota',
      'Etapa alterada de "' || COALESCE(OLD.etapa_funil, 'a_contatar') || '" para "' || COALESCE(NEW.etapa_funil, 'a_contatar') || '" (categoria: ' || COALESCE(NEW.categoria, 'não definida') || ').',
      auth.uid()
    );
  END IF;

  IF NEW.categoria IS DISTINCT FROM OLD.categoria THEN
    INSERT INTO public.interacoes (conta_id, tipo, descricao, created_by)
    VALUES (
      NEW.id,
      'nota',
      'Categoria da conta alterada de "' || COALESCE(OLD.categoria, 'não definida') || '" para "' || COALESCE(NEW.categoria, 'não definida') || '".',
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_conta_movimentacao ON public.contas;
CREATE TRIGGER trg_conta_movimentacao
  AFTER UPDATE ON public.contas
  FOR EACH ROW
  EXECUTE FUNCTION public.log_conta_movimentacao();