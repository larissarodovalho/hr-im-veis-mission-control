-- ETAPA 2 — Modelo de dados dos links temporários de imóveis

CREATE TABLE IF NOT EXISTS public.imovel_apresentacao_config (
  imovel_id uuid PRIMARY KEY REFERENCES public.imoveis(id) ON DELETE CASCADE,
  descricao_publica text,
  video_url text,
  exibir_valor_padrao boolean NOT NULL DEFAULT true,
  localizacao_padrao text NOT NULL DEFAULT 'bairro_cidade',
  fotos_publicas text[],
  condicoes_comerciais_publicas text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT imovel_apres_localizacao_chk CHECK (localizacao_padrao IN ('bairro_cidade','aproximada','completa'))
);

CREATE TABLE IF NOT EXISTS public.imovel_links_compartilhados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  token text NOT NULL UNIQUE,
  codigo_referencia text NOT NULL UNIQUE,
  titulo_selecao text,
  mensagem_apresentacao text,
  conta_id uuid REFERENCES public.contas(id) ON DELETE SET NULL,
  oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  corretor_id uuid NOT NULL,
  created_by uuid NOT NULL,
  validade_minutos integer NOT NULL,
  inicio_validade text NOT NULL DEFAULT 'criacao',
  validade_iniciada_em timestamptz,
  expira_em timestamptz,
  estado_operacional text NOT NULL DEFAULT 'ativo',
  compartilhado_em timestamptz,
  canal_compartilhamento text,
  primeiro_acesso_em timestamptz,
  ultimo_acesso_em timestamptz,
  total_acessos integer NOT NULL DEFAULT 0,
  visitantes_unicos integer NOT NULL DEFAULT 0,
  configuracao_publica jsonb NOT NULL DEFAULT '{}'::jsonb,
  substitui_link_id uuid REFERENCES public.imovel_links_compartilhados(id) ON DELETE SET NULL,
  revogado_em timestamptz,
  revogado_por uuid,
  motivo_revogacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT imovel_links_tipo_chk CHECK (tipo IN ('imovel','selecao')),
  CONSTRAINT imovel_links_inicio_chk CHECK (inicio_validade IN ('criacao','compartilhamento','primeiro_acesso')),
  CONSTRAINT imovel_links_estado_chk CHECK (estado_operacional IN ('ativo','revogado','substituido')),
  CONSTRAINT imovel_links_validade_chk CHECK (validade_minutos > 0),
  CONSTRAINT imovel_links_token_chk CHECK (char_length(token) >= 32)
);

CREATE TABLE IF NOT EXISTS public.imovel_link_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.imovel_links_compartilhados(id) ON DELETE CASCADE,
  imovel_id uuid NOT NULL REFERENCES public.imoveis(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  configuracao_publica jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (link_id, imovel_id)
);

CREATE TABLE IF NOT EXISTS public.imovel_link_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.imovel_links_compartilhados(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.imovel_link_itens(id) ON DELETE SET NULL,
  tipo_evento text NOT NULL,
  visitor_id_hash text,
  session_id_hash text,
  dispositivo text,
  navegador text,
  sistema_operacional text,
  referrer text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT imovel_link_eventos_tipo_chk CHECK (tipo_evento IN (
    'abertura','visualizacao_imovel','clique_whatsapp','copiar_link','compartilhamento_nativo',
    'gostei','rejeitou','solicitou_informacoes','solicitou_visita','tentativa_apos_expiracao')),
  CONSTRAINT imovel_link_eventos_ua_chk CHECK (user_agent IS NULL OR char_length(user_agent) <= 512)
);

CREATE TABLE IF NOT EXISTS public.imovel_link_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid REFERENCES public.imovel_links_compartilhados(id) ON DELETE SET NULL,
  acao text NOT NULL,
  dados_anteriores jsonb,
  dados_novos jsonb,
  executado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imovel_links_corretor ON public.imovel_links_compartilhados (corretor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_imovel_links_conta ON public.imovel_links_compartilhados (conta_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_imovel_links_oportunidade ON public.imovel_links_compartilhados (oportunidade_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_imovel_links_expira ON public.imovel_links_compartilhados (expira_em);
CREATE INDEX IF NOT EXISTS idx_imovel_link_itens_imovel ON public.imovel_link_itens (imovel_id);
CREATE INDEX IF NOT EXISTS idx_imovel_link_eventos_link_data ON public.imovel_link_eventos (link_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_imovel_link_eventos_tipo ON public.imovel_link_eventos (link_id, tipo_evento);
CREATE INDEX IF NOT EXISTS idx_imovel_link_auditoria_link ON public.imovel_link_auditoria (link_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_imovel_apres_updated ON public.imovel_apresentacao_config;
CREATE TRIGGER trg_imovel_apres_updated BEFORE UPDATE ON public.imovel_apresentacao_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_imovel_links_updated ON public.imovel_links_compartilhados;
CREATE TRIGGER trg_imovel_links_updated BEFORE UPDATE ON public.imovel_links_compartilhados
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.imovel_apresentacao_config TO authenticated;
GRANT ALL ON public.imovel_apresentacao_config TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imovel_links_compartilhados TO authenticated;
GRANT ALL ON public.imovel_links_compartilhados TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imovel_link_itens TO authenticated;
GRANT ALL ON public.imovel_link_itens TO service_role;
GRANT SELECT ON public.imovel_link_eventos TO authenticated;
GRANT ALL ON public.imovel_link_eventos TO service_role;
GRANT SELECT ON public.imovel_link_auditoria TO authenticated;
GRANT ALL ON public.imovel_link_auditoria TO service_role;

ALTER TABLE public.imovel_apresentacao_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imovel_links_compartilhados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imovel_link_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imovel_link_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imovel_link_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage apresentacao config" ON public.imovel_apresentacao_config;
CREATE POLICY "Staff manage apresentacao config" ON public.imovel_apresentacao_config
FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Staff read links" ON public.imovel_links_compartilhados;
CREATE POLICY "Staff read links" ON public.imovel_links_compartilhados
FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "Staff create links" ON public.imovel_links_compartilhados;
CREATE POLICY "Staff create links" ON public.imovel_links_compartilhados
FOR INSERT TO authenticated WITH CHECK (public.is_staff() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Owner or admin updates links" ON public.imovel_links_compartilhados;
CREATE POLICY "Owner or admin updates links" ON public.imovel_links_compartilhados
FOR UPDATE TO authenticated USING (
  created_by = auth.uid() OR corretor_id = auth.uid()
  OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')
);

DROP POLICY IF EXISTS "Admin deletes links" ON public.imovel_links_compartilhados;
CREATE POLICY "Admin deletes links" ON public.imovel_links_compartilhados
FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Staff manage link itens" ON public.imovel_link_itens;
CREATE POLICY "Staff manage link itens" ON public.imovel_link_itens
FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Staff read link eventos" ON public.imovel_link_eventos;
CREATE POLICY "Staff read link eventos" ON public.imovel_link_eventos
FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "Staff read link auditoria" ON public.imovel_link_auditoria;
CREATE POLICY "Staff read link auditoria" ON public.imovel_link_auditoria
FOR SELECT TO authenticated USING (public.is_staff());

CREATE OR REPLACE VIEW public.imovel_links_status
WITH (security_invoker = true) AS
SELECT
  l.*,
  (SELECT count(*) FROM public.imovel_link_itens i WHERE i.link_id = l.id) AS total_itens,
  CASE
    WHEN l.estado_operacional = 'revogado' THEN 'revogado'
    WHEN l.estado_operacional = 'substituido' THEN 'substituido'
    WHEN EXISTS (
      SELECT 1 FROM public.imovel_link_itens i
      JOIN public.imoveis im ON im.id = i.imovel_id
      WHERE i.link_id = l.id AND lower(coalesce(im.status,'')) IN ('vendido','indisponivel','indisponível')
    ) THEN 'imovel_indisponivel'
    WHEN l.expira_em IS NULL THEN 'aguardando_inicio'
    WHEN l.expira_em <= now() THEN 'expirado'
    WHEN l.primeiro_acesso_em IS NULL THEN 'nao_aberto'
    WHEN l.expira_em - now() <= interval '60 minutes' THEN 'proximo_de_expirar'
    WHEN l.ultimo_acesso_em IS NOT NULL AND l.ultimo_acesso_em >= now() - interval '15 minutes' THEN 'aberto'
    ELSE 'ativo'
  END AS status_calculado
FROM public.imovel_links_compartilhados l;

GRANT SELECT ON public.imovel_links_status TO authenticated;