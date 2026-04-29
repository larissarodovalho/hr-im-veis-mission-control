CREATE TABLE public.booking_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  lead_id uuid,
  conversation_id uuid,
  phone text,
  nome text,
  kind text NOT NULL CHECK (kind IN ('videochamada','presencial','ligacao')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  reuniao_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_links_token ON public.booking_links(token);
CREATE INDEX idx_booking_links_lead ON public.booking_links(lead_id);

ALTER TABLE public.booking_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full booking_links"
  ON public.booking_links FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Staff sees booking_links"
  ON public.booking_links FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role) OR has_role(auth.uid(), 'corretor'::app_role));