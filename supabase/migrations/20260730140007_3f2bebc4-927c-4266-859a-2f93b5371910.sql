-- 1. Novos campos em leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS tipo_acompanhamento text,
  ADD COLUMN IF NOT EXISTS motivo_desclassificacao text;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_tipo_acompanhamento_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_tipo_acompanhamento_check
  CHECK (tipo_acompanhamento IS NULL OR tipo_acompanhamento = ANY (ARRAY['ia','manual','corretor']));

-- 2. Novos campos em contas (conta desclassificada)
ALTER TABLE public.contas
  ADD COLUMN IF NOT EXISTS desclassificada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_desclassificacao text;

-- 3. Canal na interação + tipos ampliados (audio, whatsapp_ia, followup_manual)
ALTER TABLE public.interacoes
  ADD COLUMN IF NOT EXISTS canal text;

ALTER TABLE public.interacoes DROP CONSTRAINT IF EXISTS interacoes_tipo_check;
ALTER TABLE public.interacoes
  ADD CONSTRAINT interacoes_tipo_check
  CHECK (tipo = ANY (ARRAY['ligacao','mensagem','audio','visita','reuniao','email','nota','whatsapp_ia','followup_manual']));

-- 4. Backfill: etapas de acompanhamento viram "Em Contato" com tipo identificado
UPDATE public.leads
SET etapa_funil = 'Em Contato', tipo_acompanhamento = 'ia', updated_at = now()
WHERE etapa_funil = 'IA de acompanhamento';

UPDATE public.leads
SET etapa_funil = 'Em Contato', tipo_acompanhamento = 'manual', updated_at = now()
WHERE etapa_funil = 'Manual de acompanhamento';