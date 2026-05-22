ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS percent_vendedor numeric NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS percent_captador numeric NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS percent_hr numeric NOT NULL DEFAULT 30;