-- Tabela de conversas do WhatsApp
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  contact_name TEXT,
  lead_id TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_preview TEXT,
  unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mensagens
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  external_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_messages_conv ON public.whatsapp_messages(conversation_id, timestamp DESC);
CREATE INDEX idx_wa_conversations_last ON public.whatsapp_conversations(last_message_at DESC);

-- RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view conversations"
ON public.whatsapp_conversations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert conversations"
ON public.whatsapp_conversations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update conversations"
ON public.whatsapp_conversations FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view messages"
ON public.whatsapp_messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert messages"
ON public.whatsapp_messages FOR INSERT TO authenticated WITH CHECK (true);

-- Service role (edge functions / webhooks) precisa acesso total
CREATE POLICY "Service role full access conversations"
ON public.whatsapp_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access messages"
ON public.whatsapp_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_wa_conv_updated
BEFORE UPDATE ON public.whatsapp_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.whatsapp_messages REPLICA IDENTITY FULL;
ALTER TABLE public.whatsapp_conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;