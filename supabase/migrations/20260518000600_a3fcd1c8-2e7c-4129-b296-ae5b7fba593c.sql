ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS codigo TEXT,
  ADD COLUMN IF NOT EXISTS proprietario_id UUID;

CREATE SEQUENCE IF NOT EXISTS public.imoveis_codigo_seq START 1;

CREATE OR REPLACE FUNCTION public.imoveis_set_codigo()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := 'HR-' || lpad(nextval('public.imoveis_codigo_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_imoveis_set_codigo ON public.imoveis;
CREATE TRIGGER trg_imoveis_set_codigo
BEFORE INSERT ON public.imoveis
FOR EACH ROW EXECUTE FUNCTION public.imoveis_set_codigo();

-- Backfill em ordem de criação
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at) AS rn
  FROM public.imoveis
  WHERE codigo IS NULL OR codigo = ''
)
UPDATE public.imoveis i
SET codigo = 'HR-' || lpad(n.rn::text, 4, '0')
FROM numbered n
WHERE i.id = n.id;

-- Avança a sequência para o próximo valor disponível
SELECT setval(
  'public.imoveis_codigo_seq',
  GREATEST(
    (SELECT COALESCE(MAX(NULLIF(regexp_replace(codigo, '\D', '', 'g'), '')::int), 0) FROM public.imoveis),
    1
  )
);

ALTER TABLE public.imoveis
  ADD CONSTRAINT imoveis_codigo_unique UNIQUE (codigo);

CREATE INDEX IF NOT EXISTS imoveis_proprietario_id_idx ON public.imoveis(proprietario_id);