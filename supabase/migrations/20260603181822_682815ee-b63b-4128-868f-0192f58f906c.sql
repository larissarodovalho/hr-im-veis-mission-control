-- 1) Trigger function for whatsapp_conversations
CREATE OR REPLACE FUNCTION public.notify_wa_conversation_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, realtime
AS $$
DECLARE
  v_row record;
  v_event text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_row := OLD;
    v_event := 'conv:deleted';
  ELSIF TG_OP = 'INSERT' THEN
    v_row := NEW;
    v_event := 'conv:new';
  ELSE
    v_row := NEW;
    v_event := 'conv:updated';
  END IF;

  v_payload := jsonb_build_object('id', v_row.id, 'op', TG_OP);

  -- Always to admin/gestor topic
  PERFORM realtime.send(v_payload, v_event, 'wa:staff:admin', true);

  -- Per-responsavel topic, or unassigned bucket
  IF v_row.responsavel_id IS NOT NULL THEN
    PERFORM realtime.send(v_payload, v_event, 'wa:user:' || v_row.responsavel_id::text, true);
  ELSE
    PERFORM realtime.send(v_payload, v_event, 'wa:unassigned', true);
  END IF;

  -- If UPDATE changed responsavel, also notify the previous owner so their list drops it
  IF TG_OP = 'UPDATE' AND OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id THEN
    IF OLD.responsavel_id IS NOT NULL THEN
      PERFORM realtime.send(v_payload, v_event, 'wa:user:' || OLD.responsavel_id::text, true);
    ELSE
      PERFORM realtime.send(v_payload, v_event, 'wa:unassigned', true);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_wa_conversation ON public.whatsapp_conversations;
CREATE TRIGGER trg_notify_wa_conversation
AFTER INSERT OR UPDATE OR DELETE ON public.whatsapp_conversations
FOR EACH ROW EXECUTE FUNCTION public.notify_wa_conversation_change();

-- 2) Trigger function for whatsapp_messages
CREATE OR REPLACE FUNCTION public.notify_wa_message_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, realtime
AS $$
DECLARE
  v_resp uuid;
  v_payload jsonb;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RETURN NULL;
  END IF;

  SELECT responsavel_id INTO v_resp
  FROM public.whatsapp_conversations
  WHERE id = NEW.conversation_id;

  v_payload := jsonb_build_object(
    'id', NEW.id,
    'conversation_id', NEW.conversation_id,
    'direction', NEW.direction
  );

  PERFORM realtime.send(v_payload, 'msg:new', 'wa:staff:admin', true);

  IF v_resp IS NOT NULL THEN
    PERFORM realtime.send(v_payload, 'msg:new', 'wa:user:' || v_resp::text, true);
  ELSE
    PERFORM realtime.send(v_payload, 'msg:new', 'wa:unassigned', true);
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_wa_message ON public.whatsapp_messages;
CREATE TRIGGER trg_notify_wa_message
AFTER INSERT ON public.whatsapp_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_wa_message_change();

-- 3) RLS on realtime.messages: scope WA topics, allow staff on other broadcast topics
DROP POLICY IF EXISTS "Authenticated staff can subscribe" ON realtime.messages;

CREATE POLICY "Realtime broadcast scoped subscribe"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  extension = 'broadcast'
  AND (
    -- WhatsApp per-user topic: only the owner
    topic = 'wa:user:' || auth.uid()::text
    -- Unassigned bucket: any staff (matches SELECT RLS on whatsapp_conversations)
    OR (topic = 'wa:unassigned' AND public.is_staff())
    -- Admin/gestor full view
    OR (topic = 'wa:staff:admin' AND public.is_admin())
    -- Any non-WA topic: staff fallback (preserves existing behavior)
    OR (topic NOT LIKE 'wa:%' AND public.is_staff())
  )
);

-- Allow staff to publish broadcast messages (needed if any client emits broadcasts)
DROP POLICY IF EXISTS "Realtime broadcast staff publish" ON realtime.messages;
CREATE POLICY "Realtime broadcast staff publish"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  extension = 'broadcast' AND public.is_staff()
);