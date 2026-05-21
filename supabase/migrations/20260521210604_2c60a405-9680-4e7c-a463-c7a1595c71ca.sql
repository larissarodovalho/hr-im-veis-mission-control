ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS corretor_captador_id uuid,
  ADD COLUMN IF NOT EXISTS corretor_parceiro_id uuid,
  ADD COLUMN IF NOT EXISTS matricula text;