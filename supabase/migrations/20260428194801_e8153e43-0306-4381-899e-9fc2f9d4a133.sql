-- 1. Coluna ai_enabled em whatsapp_conversations (default true para novos)
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT true;

-- 2. Coluna author em whatsapp_messages (humano | ia | lead | sistema)
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS author TEXT;

-- 3. Tabelas para o chat público (/captura)
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session ON public.ai_chat_messages(session_id, created_at);

-- RLS: somente service role escreve; admin/gestor lê
CREATE POLICY "Service role full access ai_chat_sessions"
  ON public.ai_chat_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ai_chat_messages"
  ON public.ai_chat_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admin/gestor view ai_chat_sessions"
  ON public.ai_chat_sessions FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "Admin/gestor view ai_chat_messages"
  ON public.ai_chat_messages FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE TRIGGER trg_ai_chat_sessions_updated
  BEFORE UPDATE ON public.ai_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();