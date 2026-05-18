ALTER TABLE public.reunioes ADD COLUMN IF NOT EXISTS imovel_id uuid;
CREATE INDEX IF NOT EXISTS reunioes_imovel_id_idx ON public.reunioes(imovel_id);