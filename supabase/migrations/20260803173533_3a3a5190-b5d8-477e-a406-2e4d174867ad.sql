UPDATE public.leads
SET etapa_funil = 'Pré-atendimento', updated_at = now()
WHERE etapa_funil = 'Perdido'
  AND id NOT IN (SELECT lead_id_origem FROM public.contas WHERE lead_id_origem IS NOT NULL);