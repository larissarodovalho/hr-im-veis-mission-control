
ALTER TABLE public.google_calendar_sync
  DROP CONSTRAINT IF EXISTS google_calendar_sync_user_id_entity_type_entity_id_key;

UPDATE public.google_calendar_sync SET calendar_id = COALESCE(calendar_id, 'primary') WHERE calendar_id IS NULL;
ALTER TABLE public.google_calendar_sync ALTER COLUMN calendar_id SET NOT NULL;
ALTER TABLE public.google_calendar_sync ALTER COLUMN calendar_id SET DEFAULT 'primary';

ALTER TABLE public.google_calendar_sync
  ADD CONSTRAINT google_calendar_sync_user_cal_entity_key UNIQUE (user_id, calendar_id, entity_type, entity_id);
