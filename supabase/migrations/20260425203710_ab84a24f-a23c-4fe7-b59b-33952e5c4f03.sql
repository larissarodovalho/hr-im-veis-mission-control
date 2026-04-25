
DROP POLICY IF EXISTS "Authenticated insert conversations" ON public.whatsapp_conversations;
CREATE POLICY "Brokers insert conversations"
ON public.whatsapp_conversations FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'corretor'::app_role)
);
