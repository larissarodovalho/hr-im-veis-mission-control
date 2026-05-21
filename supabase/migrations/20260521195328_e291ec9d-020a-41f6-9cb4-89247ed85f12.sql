
ALTER TABLE public.vendas
  ADD COLUMN corretor_vendedor_id uuid,
  ADD COLUMN corretor_captador_id uuid,
  ADD COLUMN corretor_parceiro_id uuid;
