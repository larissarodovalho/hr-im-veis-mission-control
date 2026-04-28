UPDATE public.leads SET etapa_funil = CASE etapa_funil
  WHEN 'Prospecção' THEN 'Novo Lead'
  WHEN 'Qualificação' THEN 'Em Contato'
  WHEN 'Apresentação' THEN 'Conversa Ativa'
  WHEN 'Negociação' THEN 'Reunião Agendada'
  WHEN 'Fechamento' THEN 'Fechado'
  ELSE etapa_funil
END
WHERE etapa_funil IN ('Prospecção','Qualificação','Apresentação','Negociação','Fechamento');

ALTER TABLE public.leads ALTER COLUMN etapa_funil SET DEFAULT 'Novo Lead';