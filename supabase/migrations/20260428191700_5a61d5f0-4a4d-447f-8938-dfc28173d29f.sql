ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS author text NOT NULL DEFAULT 'humano';

ALTER TABLE public.whatsapp_messages
  DROP CONSTRAINT IF EXISTS whatsapp_messages_author_check;

ALTER TABLE public.whatsapp_messages
  ADD CONSTRAINT whatsapp_messages_author_check
  CHECK (author IN ('humano', 'ia', 'sistema'));