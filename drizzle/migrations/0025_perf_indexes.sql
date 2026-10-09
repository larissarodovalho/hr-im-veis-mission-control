CREATE INDEX IF NOT EXISTS idx_gcal_sync_event ON public.google_calendar_sync (google_event_id);
CREATE INDEX IF NOT EXISTS idx_gcal_sync_cal_event ON public.google_calendar_sync (calendar_id, google_event_id);
CREATE INDEX IF NOT EXISTS idx_contas_nome ON public.contas (nome);
CREATE INDEX IF NOT EXISTS idx_reunioes_conta ON public.reunioes (conta_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_conta_recent ON public.interacoes (created_at DESC) WHERE conta_id IS NOT NULL;