
-- 1. whatsapp_conversations & messages: remove NULL responsavel branch (staff only)
DROP POLICY IF EXISTS "Corretor sees own conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Corretor updates own conversations" ON public.whatsapp_conversations;

CREATE POLICY "Corretor sees own conversations"
  ON public.whatsapp_conversations FOR SELECT TO authenticated
  USING (responsavel_id = auth.uid());

CREATE POLICY "Corretor updates own conversations"
  ON public.whatsapp_conversations FOR UPDATE TO authenticated
  USING (responsavel_id = auth.uid());

-- Allow staff (corretor role) to view unassigned conversations as well so inbox still works
CREATE POLICY "Staff sees unassigned conversations"
  ON public.whatsapp_conversations FOR SELECT TO authenticated
  USING (responsavel_id IS NULL AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'corretor'::app_role)
  ));

CREATE POLICY "Staff updates unassigned conversations"
  ON public.whatsapp_conversations FOR UPDATE TO authenticated
  USING (responsavel_id IS NULL AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'corretor'::app_role)
  ));

DROP POLICY IF EXISTS "View messages of accessible conversations" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Insert messages on accessible conversations" ON public.whatsapp_messages;

CREATE POLICY "View messages of accessible conversations"
  ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.whatsapp_conversations c
    WHERE c.id = whatsapp_messages.conversation_id
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'gestor'::app_role)
        OR c.responsavel_id = auth.uid()
        OR (c.responsavel_id IS NULL AND has_role(auth.uid(), 'corretor'::app_role))
      )
  ));

CREATE POLICY "Insert messages on accessible conversations"
  ON public.whatsapp_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.whatsapp_conversations c
    WHERE c.id = whatsapp_messages.conversation_id
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'gestor'::app_role)
        OR c.responsavel_id = auth.uid()
        OR (c.responsavel_id IS NULL AND has_role(auth.uid(), 'corretor'::app_role))
      )
  ));

-- 2. document_events: restrict INSERT to staff linked to the document
DROP POLICY IF EXISTS "events insert auth" ON public.document_events;
CREATE POLICY "events insert staff linked"
  ON public.document_events FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    AND EXISTS (
      SELECT 1 FROM public.signed_documents sd
      WHERE sd.id = document_events.document_id
        AND (public.is_admin() OR sd.created_by = auth.uid())
    )
  );

-- 3. signed-documents storage bucket: restrict to staff/owner
DROP POLICY IF EXISTS "signed-docs read auth" ON storage.objects;
DROP POLICY IF EXISTS "signed-docs insert auth" ON storage.objects;
DROP POLICY IF EXISTS "signed-docs update auth" ON storage.objects;

CREATE POLICY "signed-docs read staff or owner"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'signed-documents'
    AND (public.is_admin() OR owner = auth.uid())
  );

CREATE POLICY "signed-docs insert staff"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'signed-documents'
    AND public.is_staff()
    AND owner = auth.uid()
  );

CREATE POLICY "signed-docs update owner or admin"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'signed-documents'
    AND (public.is_admin() OR owner = auth.uid())
  );

-- 4. imoveis public exposure: restrict columns visible to anon
REVOKE SELECT ON public.imoveis FROM anon;
GRANT SELECT (
  id, titulo, tipo, finalidade, status, valor, valor_condominio, valor_iptu,
  endereco, numero, complemento, bairro, cidade, estado, cep,
  area_util, area_total, area_construida, quartos, suites, banheiros, vagas,
  caracteristicas, fotos, destaque, codigo, descricao, created_at, updated_at
) ON public.imoveis TO anon;

-- 5. realtime channel authorization
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated staff can subscribe" ON realtime.messages;
CREATE POLICY "Authenticated staff can subscribe"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'corretor'::app_role)
  );

-- 6. SECURITY DEFINER functions: tighten search_path & revoke EXECUTE from anon
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.normalize_br_phone(text) SET search_path = public;
ALTER FUNCTION public.imoveis_set_codigo() SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_lead_ultima_interacao() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.wa_set_responsavel() FROM anon, authenticated;
