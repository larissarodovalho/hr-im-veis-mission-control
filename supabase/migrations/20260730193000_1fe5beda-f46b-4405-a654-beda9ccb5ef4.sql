ALTER TABLE public.interacoes ADD COLUMN IF NOT EXISTS pontualidade TEXT;

-- Backfill: classifica tentativas já registradas (ancoradas na entrada do lead, tolerância de 1h)
UPDATE public.interacoes i
SET pontualidade = CASE
  WHEN i.created_at < (COALESCE(l.data_entrada, l.created_at) + t.prazo_horas * interval '1 hour') - interval '1 hour' THEN 'adiantada'
  WHEN i.created_at <= (COALESCE(l.data_entrada, l.created_at) + t.prazo_horas * interval '1 hour') + interval '1 hour' THEN 'no_prazo'
  ELSE 'atrasada'
END
FROM public.leads l
CROSS JOIN (VALUES ('mensagem', 0), ('audio', 24), ('ligacao', 48)) AS t(tipo, prazo_horas)
WHERE i.lead_id = l.id
  AND i.tipo = t.tipo
  AND i.pontualidade IS NULL;