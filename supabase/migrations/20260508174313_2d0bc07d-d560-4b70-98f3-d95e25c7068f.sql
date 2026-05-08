ALTER TABLE public.contas ADD COLUMN IF NOT EXISTS etapa_funil text NOT NULL DEFAULT 'a_contatar';
CREATE INDEX IF NOT EXISTS idx_contas_etapa_funil ON public.contas(etapa_funil);