
CREATE TABLE public.newsletter_campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assunto TEXT NOT NULL,
  manchete TEXT,
  corpo TEXT,
  imoveis_ids UUID[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho','aguardando_aprovacao','aprovada','enviando','enviada','cancelada')),
  total_destinatarios INTEGER NOT NULL DEFAULT 0,
  total_enviados INTEGER NOT NULL DEFAULT 0,
  total_falhas INTEGER NOT NULL DEFAULT 0,
  criada_por UUID REFERENCES auth.users(id),
  aprovada_por UUID REFERENCES auth.users(id),
  aprovada_em TIMESTAMPTZ,
  enviada_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_campanhas TO authenticated;
GRANT ALL ON public.newsletter_campanhas TO service_role;

ALTER TABLE public.newsletter_campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor ver campanhas" ON public.newsletter_campanhas
  FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admin/gestor criar campanhas" ON public.newsletter_campanhas
  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admin/gestor atualizar campanhas" ON public.newsletter_campanhas
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin/gestor deletar campanhas" ON public.newsletter_campanhas
  FOR DELETE TO authenticated USING (is_admin());

CREATE TRIGGER trg_newsletter_campanhas_updated_at
  BEFORE UPDATE ON public.newsletter_campanhas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.newsletter_envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES public.newsletter_campanhas(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.newsletter_subscribers(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','suppressed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campanha_id, email)
);

GRANT SELECT ON public.newsletter_envios TO authenticated;
GRANT ALL ON public.newsletter_envios TO service_role;

ALTER TABLE public.newsletter_envios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor ver envios" ON public.newsletter_envios
  FOR SELECT TO authenticated USING (is_admin());

CREATE INDEX idx_newsletter_envios_campanha ON public.newsletter_envios(campanha_id);
