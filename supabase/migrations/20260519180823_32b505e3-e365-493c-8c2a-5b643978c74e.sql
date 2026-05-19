ALTER TABLE public.contas ADD COLUMN IF NOT EXISTS temperatura text;
CREATE INDEX IF NOT EXISTS idx_contas_temperatura ON public.contas(temperatura);