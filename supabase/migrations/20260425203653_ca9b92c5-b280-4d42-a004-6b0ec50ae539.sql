
-- 1. Add responsible broker column
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS responsavel_id uuid;

CREATE INDEX IF NOT EXISTS idx_wa_conv_responsavel ON public.whatsapp_conversations(responsavel_id);

-- 2. Backfill from leads when lead_id matches a real lead
UPDATE public.whatsapp_conversations c
SET responsavel_id = l.corretor_id
FROM public.leads l
WHERE c.lead_id IS NOT NULL
  AND c.lead_id ~ '^[0-9a-f-]{36}$'
  AND l.id::text = c.lead_id
  AND c.responsavel_id IS NULL;

-- 3. Trigger to auto-assign responsavel from linked lead
CREATE OR REPLACE FUNCTION public.wa_set_responsavel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_corretor uuid;
BEGIN
  IF NEW.responsavel_id IS NULL AND NEW.lead_id IS NOT NULL AND NEW.lead_id ~ '^[0-9a-f-]{36}$' THEN
    SELECT corretor_id INTO v_corretor FROM public.leads WHERE id::text = NEW.lead_id;
    IF v_corretor IS NOT NULL THEN
      NEW.responsavel_id := v_corretor;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wa_set_responsavel ON public.whatsapp_conversations;
CREATE TRIGGER trg_wa_set_responsavel
BEFORE INSERT OR UPDATE OF lead_id ON public.whatsapp_conversations
FOR EACH ROW EXECUTE FUNCTION public.wa_set_responsavel();

-- 4. Replace permissive RLS on conversations
DROP POLICY IF EXISTS "Authenticated users can view conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Authenticated users can update conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Authenticated users can insert conversations" ON public.whatsapp_conversations;

CREATE POLICY "Admin/gestor see all conversations"
ON public.whatsapp_conversations FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Corretor sees own conversations"
ON public.whatsapp_conversations FOR SELECT TO authenticated
USING (responsavel_id = auth.uid() OR responsavel_id IS NULL);

CREATE POLICY "Authenticated insert conversations"
ON public.whatsapp_conversations FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Admin/gestor update any conversation"
ON public.whatsapp_conversations FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Corretor updates own conversations"
ON public.whatsapp_conversations FOR UPDATE TO authenticated
USING (responsavel_id = auth.uid() OR responsavel_id IS NULL);

CREATE POLICY "Admin/gestor delete conversations"
ON public.whatsapp_conversations FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- 5. Replace permissive RLS on messages — gated by conversation access
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.whatsapp_messages;

CREATE POLICY "View messages of accessible conversations"
ON public.whatsapp_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.whatsapp_conversations c
    WHERE c.id = whatsapp_messages.conversation_id
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'gestor'::app_role)
        OR c.responsavel_id = auth.uid()
        OR c.responsavel_id IS NULL
      )
  )
);

CREATE POLICY "Insert messages on accessible conversations"
ON public.whatsapp_messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.whatsapp_conversations c
    WHERE c.id = whatsapp_messages.conversation_id
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'gestor'::app_role)
        OR c.responsavel_id = auth.uid()
        OR c.responsavel_id IS NULL
      )
  )
);
