ALTER TABLE public.conta_propostas
  ADD COLUMN IF NOT EXISTS imovel_id uuid REFERENCES public.imoveis(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conta_propostas_imovel_idx ON public.conta_propostas(imovel_id);