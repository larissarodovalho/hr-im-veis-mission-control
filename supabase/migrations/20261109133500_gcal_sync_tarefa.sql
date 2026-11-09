ALTER TABLE public.google_calendar_sync DROP CONSTRAINT IF EXISTS google_calendar_sync_entity_type_check;
ALTER TABLE public.google_calendar_sync ADD CONSTRAINT google_calendar_sync_entity_type_check CHECK (entity_type IN ('reuniao','ligacao','visita','captacao','tarefa'));
