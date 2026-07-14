
CREATE TABLE public.conta_propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL REFERENCES public.contas(id) ON DELETE CASCADE,
  data_proposta date NOT NULL,
  valor numeric,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aceita','recusada')),
  descricao text,
  corretor_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conta_propostas_conta_idx ON public.conta_propostas(conta_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conta_propostas TO authenticated;
GRANT ALL ON public.conta_propostas TO service_role;

ALTER TABLE public.conta_propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cp_select" ON public.conta_propostas FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR created_by = auth.uid()
  OR corretor_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = conta_id AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid()))
);

CREATE POLICY "cp_insert" ON public.conta_propostas FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin()
  OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = conta_id AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid()))
);

CREATE POLICY "cp_update" ON public.conta_propostas FOR UPDATE TO authenticated
USING (
  public.is_admin()
  OR created_by = auth.uid()
  OR corretor_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = conta_id AND c.responsavel_id = auth.uid())
);

CREATE POLICY "cp_delete" ON public.conta_propostas FOR DELETE TO authenticated
USING (
  public.is_admin()
  OR created_by = auth.uid()
);

CREATE TRIGGER conta_propostas_updated_at
BEFORE UPDATE ON public.conta_propostas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
