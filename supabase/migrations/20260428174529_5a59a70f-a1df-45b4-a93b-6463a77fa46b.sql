-- ===== Helper is_admin() =====
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'gestor'::app_role);
$$;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ===== Helper is_staff() : staff = admin/gestor/corretor =====
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'gestor'::app_role)
      OR public.has_role(auth.uid(), 'corretor'::app_role);
$$;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;

-- ===== Normalização BR de telefone =====
CREATE OR REPLACE FUNCTION public.normalize_br_phone(p text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE digits text;
BEGIN
  digits := regexp_replace(coalesce(p,''), '\D', '', 'g');
  IF length(digits) > 10 AND left(digits, 2) = '55' THEN
    digits := substr(digits, 3);
  END IF;
  IF length(digits) = 11 AND substr(digits, 3, 1) = '9' THEN
    RETURN substr(digits, 1, 2) || substr(digits, 4);
  END IF;
  RETURN right(digits, 10);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.normalize_br_phone(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.normalize_br_phone(text) TO authenticated, service_role;

-- ===== Enums =====
DO $$ BEGIN
  CREATE TYPE public.signed_document_status AS ENUM ('draft','sent','partially_signed','signed','refused','expired','canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.document_signer_status AS ENUM ('pending','viewed','signed','refused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== signed_documents =====
CREATE TABLE IF NOT EXISTS public.signed_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_url TEXT,
  signed_file_url TEXT,
  status public.signed_document_status NOT NULL DEFAULT 'draft',
  clicksign_document_key TEXT UNIQUE,
  lead_id UUID,
  conta_id UUID,
  created_by UUID,
  message TEXT,
  deadline_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_signed_documents_lead ON public.signed_documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_signed_documents_conta ON public.signed_documents(conta_id);
CREATE INDEX IF NOT EXISTS idx_signed_documents_status ON public.signed_documents(status);

ALTER TABLE public.signed_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "docs select staff" ON public.signed_documents;
DROP POLICY IF EXISTS "docs insert auth" ON public.signed_documents;
DROP POLICY IF EXISTS "docs update staff" ON public.signed_documents;
DROP POLICY IF EXISTS "docs delete admin" ON public.signed_documents;
DROP POLICY IF EXISTS "docs service role" ON public.signed_documents;

CREATE POLICY "docs select staff" ON public.signed_documents
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "docs insert auth" ON public.signed_documents
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR public.is_admin());
CREATE POLICY "docs update staff" ON public.signed_documents
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "docs delete admin" ON public.signed_documents
  FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "docs service role" ON public.signed_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_signed_documents_updated ON public.signed_documents;
CREATE TRIGGER trg_signed_documents_updated
  BEFORE UPDATE ON public.signed_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== document_signers =====
CREATE TABLE IF NOT EXISTS public.document_signers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.signed_documents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT,
  role TEXT NOT NULL DEFAULT 'parte',
  clicksign_signer_key TEXT,
  status public.document_signer_status NOT NULL DEFAULT 'pending',
  sign_url TEXT,
  ip_address TEXT,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_signers_document ON public.document_signers(document_id);
CREATE INDEX IF NOT EXISTS idx_signers_clicksign_key ON public.document_signers(clicksign_signer_key);

ALTER TABLE public.document_signers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signers select staff" ON public.document_signers;
DROP POLICY IF EXISTS "signers insert staff" ON public.document_signers;
DROP POLICY IF EXISTS "signers update staff" ON public.document_signers;
DROP POLICY IF EXISTS "signers delete admin" ON public.document_signers;
DROP POLICY IF EXISTS "signers service role" ON public.document_signers;

CREATE POLICY "signers select staff" ON public.document_signers
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "signers insert staff" ON public.document_signers
  FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "signers update staff" ON public.document_signers
  FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "signers delete admin" ON public.document_signers
  FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "signers service role" ON public.document_signers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_document_signers_updated ON public.document_signers;
CREATE TRIGGER trg_document_signers_updated
  BEFORE UPDATE ON public.document_signers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== document_events =====
CREATE TABLE IF NOT EXISTS public.document_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.signed_documents(id) ON DELETE CASCADE,
  signer_id UUID REFERENCES public.document_signers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_document ON public.document_events(document_id);

ALTER TABLE public.document_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events select staff" ON public.document_events;
DROP POLICY IF EXISTS "events insert auth" ON public.document_events;
DROP POLICY IF EXISTS "events delete admin" ON public.document_events;
DROP POLICY IF EXISTS "events service role" ON public.document_events;

CREATE POLICY "events select staff" ON public.document_events
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "events insert auth" ON public.document_events
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "events delete admin" ON public.document_events
  FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "events service role" ON public.document_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ===== Storage bucket privado =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('signed-documents', 'signed-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "signed-docs read auth" ON storage.objects;
DROP POLICY IF EXISTS "signed-docs insert auth" ON storage.objects;
DROP POLICY IF EXISTS "signed-docs update auth" ON storage.objects;
DROP POLICY IF EXISTS "signed-docs delete admin" ON storage.objects;

CREATE POLICY "signed-docs read auth" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'signed-documents');
CREATE POLICY "signed-docs insert auth" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signed-documents');
CREATE POLICY "signed-docs update auth" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'signed-documents');
CREATE POLICY "signed-docs delete admin" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'signed-documents' AND public.is_admin());

-- ===== Realtime =====
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.signed_documents;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.document_signers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.document_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.signed_documents REPLICA IDENTITY FULL;
ALTER TABLE public.document_signers REPLICA IDENTITY FULL;
ALTER TABLE public.document_events  REPLICA IDENTITY FULL;