CREATE TABLE public.metas_institucionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade TEXT NOT NULL,
  ano INTEGER NOT NULL,
  meta_vgv NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT metas_institucionais_entidade_ano_key UNIQUE (entidade, ano),
  CONSTRAINT metas_institucionais_entidade_check CHECK (entidade IN ('hrx_producoes')),
  CONSTRAINT metas_institucionais_meta_check CHECK (meta_vgv >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas_institucionais TO authenticated;
GRANT ALL ON public.metas_institucionais TO service_role;

ALTER TABLE public.metas_institucionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff le metas institucionais"
ON public.metas_institucionais
FOR SELECT
TO authenticated
USING (public.is_staff());

CREATE POLICY "Admin insere metas institucionais"
ON public.metas_institucionais
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin altera metas institucionais"
ON public.metas_institucionais
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin exclui metas institucionais"
ON public.metas_institucionais
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER metas_institucionais_updated_at
BEFORE UPDATE ON public.metas_institucionais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();