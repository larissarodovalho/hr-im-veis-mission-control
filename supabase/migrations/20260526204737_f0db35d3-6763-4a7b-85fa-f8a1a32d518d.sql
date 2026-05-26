ALTER TABLE public.reunioes
  ADD COLUMN IF NOT EXISTS recorrencia_id uuid,
  ADD COLUMN IF NOT EXISTS recorrencia_regra text;

CREATE INDEX IF NOT EXISTS idx_reunioes_recorrencia_id ON public.reunioes(recorrencia_id);