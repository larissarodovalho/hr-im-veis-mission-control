ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nivel text NOT NULL DEFAULT 'senior';

ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS origem_negocio text,
  ADD COLUMN IF NOT EXISTS nivel_corretor text;