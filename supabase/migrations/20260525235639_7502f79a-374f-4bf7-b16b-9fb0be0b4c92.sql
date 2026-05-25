
-- 1. user_google_calendar
CREATE TABLE public.user_google_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  google_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  calendar_id text NOT NULL DEFAULT 'primary',
  sync_token text,
  scope text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_sync_at timestamptz,
  last_sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_google_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve sua conexao Google"
  ON public.user_google_calendar FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Usuario insere sua conexao Google"
  ON public.user_google_calendar FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario atualiza sua conexao Google"
  ON public.user_google_calendar FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuario apaga sua conexao Google"
  ON public.user_google_calendar FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

CREATE TRIGGER user_google_calendar_set_updated_at
  BEFORE UPDATE ON public.user_google_calendar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. google_calendar_sync
CREATE TABLE public.google_calendar_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('reuniao','ligacao','visita','captacao')),
  entity_id uuid NOT NULL,
  google_event_id text NOT NULL,
  etag text,
  html_link text,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id),
  UNIQUE (user_id, google_event_id)
);

CREATE INDEX idx_gcal_sync_entity ON public.google_calendar_sync(entity_type, entity_id);

ALTER TABLE public.google_calendar_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff le mapeamentos Google"
  ON public.google_calendar_sync FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Usuario gerencia seus mapeamentos Google"
  ON public.google_calendar_sync FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Colunas extras
ALTER TABLE public.reunioes
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'crm',
  ADD COLUMN IF NOT EXISTS google_owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS publicado_no_crm boolean NOT NULL DEFAULT true;

ALTER TABLE public.ligacoes
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'crm',
  ADD COLUMN IF NOT EXISTS google_owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS publicado_no_crm boolean NOT NULL DEFAULT true;

ALTER TABLE public.visitas
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'crm',
  ADD COLUMN IF NOT EXISTS google_owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS publicado_no_crm boolean NOT NULL DEFAULT true;

ALTER TABLE public.captacoes_imovel
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'crm',
  ADD COLUMN IF NOT EXISTS google_owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS publicado_no_crm boolean NOT NULL DEFAULT true;
