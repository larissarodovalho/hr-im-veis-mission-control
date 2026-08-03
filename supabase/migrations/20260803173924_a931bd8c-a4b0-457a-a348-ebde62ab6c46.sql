-- Preservar o selo "Manual" nos leads que estavam em "Manual de acompanhamento"
UPDATE public.leads
SET tipo_acompanhamento = 'manual', updated_at = now()
WHERE etapa_funil = 'Manual de acompanhamento'
  AND tipo_acompanhamento IS NULL;

-- Mover os leads das etapas removidas para Pré-atendimento
UPDATE public.leads
SET etapa_funil = 'Pré-atendimento', updated_at = now()
WHERE etapa_funil IN ('Manual de acompanhamento', 'Permuta');