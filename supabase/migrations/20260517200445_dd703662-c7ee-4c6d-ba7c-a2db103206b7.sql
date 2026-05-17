ALTER TABLE public.visitas ADD COLUMN IF NOT EXISTS conta_id uuid REFERENCES public.contas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_visitas_conta_id ON public.visitas(conta_id);