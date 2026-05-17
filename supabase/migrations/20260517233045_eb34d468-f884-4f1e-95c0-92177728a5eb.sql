
-- agenda_bloqueios
DROP POLICY IF EXISTS "Owner or admin deletes bloqueios" ON public.agenda_bloqueios;
CREATE POLICY "Admin only deletes bloqueios" ON public.agenda_bloqueios FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- agentes
DROP POLICY IF EXISTS "Admin/gestor delete agentes" ON public.agentes;
CREATE POLICY "Admin only deletes agentes" ON public.agentes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- campanhas_metrics_daily
DROP POLICY IF EXISTS "Admin/gestor delete campanhas metrics" ON public.campanhas_metrics_daily;
CREATE POLICY "Admin only deletes campanhas metrics" ON public.campanhas_metrics_daily FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- campanhas_trafego
DROP POLICY IF EXISTS "Admin/gestor delete campanhas" ON public.campanhas_trafego;
CREATE POLICY "Admin only deletes campanhas" ON public.campanhas_trafego FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- conta_propriedades
DROP POLICY IF EXISTS "Admin/gestor deletes conta_propriedades" ON public.conta_propriedades;
CREATE POLICY "Admin only deletes conta_propriedades" ON public.conta_propriedades FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- contas
DROP POLICY IF EXISTS "Admin/gestor deletes contas" ON public.contas;
CREATE POLICY "Admin only deletes contas" ON public.contas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- contatos
DROP POLICY IF EXISTS "Admin/gestor delete contatos" ON public.contatos;
CREATE POLICY "Admin only deletes contatos" ON public.contatos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- conteudo_posts
DROP POLICY IF EXISTS "Admin/gestor delete conteudo" ON public.conteudo_posts;
CREATE POLICY "Admin only deletes conteudo" ON public.conteudo_posts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- document_events
DROP POLICY IF EXISTS "events delete admin" ON public.document_events;
CREATE POLICY "events delete admin only" ON public.document_events FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- document_signers
DROP POLICY IF EXISTS "signers delete admin" ON public.document_signers;
CREATE POLICY "signers delete admin only" ON public.document_signers FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- signed_documents
DROP POLICY IF EXISTS "docs delete admin" ON public.signed_documents;
CREATE POLICY "docs delete admin only" ON public.signed_documents FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- imoveis
DROP POLICY IF EXISTS "Admin/gestor deletes imoveis" ON public.imoveis;
CREATE POLICY "Admin only deletes imoveis" ON public.imoveis FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- interacoes
DROP POLICY IF EXISTS "Author or admin deletes interacoes" ON public.interacoes;
CREATE POLICY "Admin only deletes interacoes" ON public.interacoes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- leads
DROP POLICY IF EXISTS "Admin/gestor delete leads" ON public.leads;
CREATE POLICY "Admin only deletes leads" ON public.leads FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ligacoes
DROP POLICY IF EXISTS "Admin/gestor deletes ligacoes" ON public.ligacoes;
CREATE POLICY "Admin only deletes ligacoes" ON public.ligacoes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- notas
DROP POLICY IF EXISTS "Author or admin delete notas" ON public.notas;
CREATE POLICY "Admin only deletes notas" ON public.notas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- propostas
DROP POLICY IF EXISTS "Admin/gestor deletes propostas" ON public.propostas;
CREATE POLICY "Admin only deletes propostas" ON public.propostas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- reunioes
DROP POLICY IF EXISTS "Admin/gestor deletes reunioes" ON public.reunioes;
CREATE POLICY "Admin only deletes reunioes" ON public.reunioes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
