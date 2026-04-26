-- 1. Adicionar tipo na tabela reunioes
ALTER TABLE public.reunioes
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'presencial',
  ADD COLUMN IF NOT EXISTS duracao_min integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS criado_por_ia boolean NOT NULL DEFAULT false;

-- 2. Tabela de bloqueios da agenda
CREATE TABLE IF NOT EXISTS public.agenda_bloqueios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  inicio timestamp with time zone NOT NULL,
  fim timestamp with time zone NOT NULL,
  motivo text,
  dia_inteiro boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_bloqueios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees bloqueios"
ON public.agenda_bloqueios FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(),'admin'::app_role)
  OR has_role(auth.uid(),'gestor'::app_role)
  OR has_role(auth.uid(),'corretor'::app_role)
);

CREATE POLICY "Authenticated insert bloqueios"
ON public.agenda_bloqueios FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin updates bloqueios"
ON public.agenda_bloqueios FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(),'admin'::app_role)
  OR has_role(auth.uid(),'gestor'::app_role)
  OR created_by = auth.uid()
);

CREATE POLICY "Owner or admin deletes bloqueios"
ON public.agenda_bloqueios FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(),'admin'::app_role)
  OR has_role(auth.uid(),'gestor'::app_role)
  OR created_by = auth.uid()
);

CREATE TRIGGER trg_bloqueios_updated_at
BEFORE UPDATE ON public.agenda_bloqueios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_bloqueios_inicio ON public.agenda_bloqueios(inicio);
CREATE INDEX IF NOT EXISTS idx_bloqueios_fim ON public.agenda_bloqueios(fim);

-- 3. Log de agendamentos criados pela IA
CREATE TABLE IF NOT EXISTS public.agenda_ia_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id uuid,
  conversation_id uuid,
  message_id uuid,
  raw_text text,
  parsed jsonb,
  status text NOT NULL DEFAULT 'created',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_ia_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees ia log"
ON public.agenda_ia_log FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(),'admin'::app_role)
  OR has_role(auth.uid(),'gestor'::app_role)
  OR has_role(auth.uid(),'corretor'::app_role)
);

CREATE POLICY "Service role full ia log"
ON public.agenda_ia_log FOR ALL
TO service_role
USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ia_log_created ON public.agenda_ia_log(created_at DESC);