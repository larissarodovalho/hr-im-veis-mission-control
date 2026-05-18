ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS conta_id uuid REFERENCES public.contas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tarefas_conta_id ON public.tarefas(conta_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_prazo ON public.tarefas(prazo);