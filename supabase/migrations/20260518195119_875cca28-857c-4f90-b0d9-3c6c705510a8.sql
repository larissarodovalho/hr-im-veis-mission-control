ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS ai_debounce_token text,
  ADD COLUMN IF NOT EXISTS ai_pending_since timestamptz;