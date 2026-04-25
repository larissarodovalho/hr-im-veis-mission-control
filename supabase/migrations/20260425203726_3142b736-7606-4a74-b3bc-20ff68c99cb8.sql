
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Insert messages on accessible conversations" ON public.whatsapp_messages;

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
