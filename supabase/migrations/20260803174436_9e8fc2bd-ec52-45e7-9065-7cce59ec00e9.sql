UPDATE public.leads
SET etapa_funil = 'Pré-atendimento', updated_at = now()
WHERE etapa_funil IN ('IA de acompanhamento', 'Reunião Agendada', 'Visita', 'Proposta', 'Fechado');