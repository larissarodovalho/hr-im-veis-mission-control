
CREATE TABLE public.conta_fechamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id uuid NOT NULL REFERENCES public.contas(id) ON DELETE CASCADE,
  data_fechamento date NOT NULL,
  valor numeric,
  imovel_id uuid REFERENCES public.imoveis(id) ON DELETE SET NULL,
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_conta_fechamentos_conta ON public.conta_fechamentos(conta_id);
CREATE INDEX idx_conta_fechamentos_data ON public.conta_fechamentos(data_fechamento DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conta_fechamentos TO authenticated;
GRANT ALL ON public.conta_fechamentos TO service_role;

ALTER TABLE public.conta_fechamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees conta_fechamentos"
ON public.conta_fechamentos FOR SELECT
USING (
  public.is_admin()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.contas c
    WHERE c.id = conta_fechamentos.conta_id
      AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid())
  )
);

CREATE POLICY "Staff creates conta_fechamentos"
ON public.conta_fechamentos FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND public.is_staff()
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.contas c
      WHERE c.id = conta_fechamentos.conta_id
        AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid())
    )
  )
);

CREATE POLICY "Author or admin updates conta_fechamentos"
ON public.conta_fechamentos FOR UPDATE
USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Author or admin deletes conta_fechamentos"
ON public.conta_fechamentos FOR DELETE
USING (created_by = auth.uid() OR public.is_admin());

CREATE TRIGGER trg_conta_fechamentos_updated_at
BEFORE UPDATE ON public.conta_fechamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
