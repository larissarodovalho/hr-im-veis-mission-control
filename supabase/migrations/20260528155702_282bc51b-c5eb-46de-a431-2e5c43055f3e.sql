
-- booking_links: restrict SELECT
DROP POLICY IF EXISTS "Staff sees booking_links" ON public.booking_links;
CREATE POLICY "Booking links scoped read"
ON public.booking_links
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'secretaria'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = booking_links.lead_id
      AND (l.corretor_id = auth.uid() OR l.created_by = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.reunioes r
    WHERE r.id = booking_links.reuniao_id
      AND (r.corretor_id = auth.uid() OR r.created_by = auth.uid())
  )
);

-- signed_documents: scope SELECT
DROP POLICY IF EXISTS "docs select staff" ON public.signed_documents;
CREATE POLICY "Signed docs scoped read"
ON public.signed_documents
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = signed_documents.lead_id
      AND (l.corretor_id = auth.uid() OR l.created_by = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.contas c
    WHERE c.id = signed_documents.conta_id
      AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid())
  )
);

-- document_signers: scope SELECT via parent
DROP POLICY IF EXISTS "signers select staff" ON public.document_signers;
CREATE POLICY "Document signers scoped read"
ON public.document_signers
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.signed_documents sd
    WHERE sd.id = document_signers.document_id
      AND (
        sd.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = sd.lead_id AND (l.corretor_id = auth.uid() OR l.created_by = auth.uid()))
        OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = sd.conta_id AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid()))
      )
  )
);

-- document_events: same scope
DROP POLICY IF EXISTS "events select staff" ON public.document_events;
CREATE POLICY "Document events scoped read"
ON public.document_events
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.signed_documents sd
    WHERE sd.id = document_events.document_id
      AND (
        sd.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = sd.lead_id AND (l.corretor_id = auth.uid() OR l.created_by = auth.uid()))
        OR EXISTS (SELECT 1 FROM public.contas c WHERE c.id = sd.conta_id AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid()))
      )
  )
);

-- conteudo_posts: include marketing
DROP POLICY IF EXISTS "Admin/gestor select conteudo" ON public.conteudo_posts;
DROP POLICY IF EXISTS "Admin/gestor insert conteudo" ON public.conteudo_posts;
DROP POLICY IF EXISTS "Admin/gestor update conteudo" ON public.conteudo_posts;

CREATE POLICY "Staff marketing select conteudo"
ON public.conteudo_posts
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'marketing'::app_role)
);

CREATE POLICY "Staff marketing insert conteudo"
ON public.conteudo_posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'marketing'::app_role)
  )
);

CREATE POLICY "Staff marketing update conteudo"
ON public.conteudo_posts
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'gestor'::app_role)
  OR has_role(auth.uid(), 'marketing'::app_role)
);
