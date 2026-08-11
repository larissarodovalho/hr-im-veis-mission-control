CREATE UNIQUE INDEX IF NOT EXISTS reunioes_google_unique
  ON public.reunioes (google_owner_user_id, titulo, agendada_para)
  WHERE origem = 'google_calendar';