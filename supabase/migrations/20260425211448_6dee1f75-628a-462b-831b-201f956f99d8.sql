-- ============ AGENTES ============
CREATE TABLE public.agentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT,
  status TEXT NOT NULL DEFAULT 'offline',
  detalhes TEXT,
  ultima_atividade TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees agentes" ON public.agentes FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'corretor'));
CREATE POLICY "Admin/gestor insert agentes" ON public.agentes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin/gestor update agentes" ON public.agentes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin/gestor delete agentes" ON public.agentes FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Service role full agentes" ON public.agentes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_agentes_updated BEFORE UPDATE ON public.agentes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SYSTEM HEALTH ============
CREATE TABLE public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  detalhe TEXT,
  ultimo_check TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees health" ON public.system_health_checks FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'corretor'));
CREATE POLICY "Admin/gestor insert health" ON public.system_health_checks FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin/gestor update health" ON public.system_health_checks FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin/gestor delete health" ON public.system_health_checks FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Service role full health" ON public.system_health_checks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_health_updated BEFORE UPDATE ON public.system_health_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ACTIVITY LOG ============
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  status TEXT DEFAULT 'success',
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor sees activity" ON public.activity_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "User sees own activity" ON public.activity_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Authenticated insert activity" ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Service role full activity" ON public.activity_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_activity_created_at ON public.activity_log(created_at DESC);
CREATE INDEX idx_activity_user ON public.activity_log(user_id);

-- ============ SOCIAL PROFILES ============
CREATE TABLE public.social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  plataforma TEXT NOT NULL,
  handle TEXT,
  seguidores INTEGER DEFAULT 0,
  alcance INTEGER DEFAULT 0,
  engajamento INTEGER DEFAULT 0,
  posts INTEGER DEFAULT 0,
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees social" ON public.social_profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'corretor'));
CREATE POLICY "Admin/gestor insert social" ON public.social_profiles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin/gestor update social" ON public.social_profiles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin/gestor delete social" ON public.social_profiles FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Service role full social" ON public.social_profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_social_updated BEFORE UPDATE ON public.social_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SOCIAL METRICS DAILY ============
CREATE TABLE public.social_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.social_profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  seguidores INTEGER DEFAULT 0,
  alcance INTEGER DEFAULT 0,
  engajamento INTEGER DEFAULT 0,
  posts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, data)
);
ALTER TABLE public.social_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff sees social metrics" ON public.social_metrics_daily FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'corretor'));
CREATE POLICY "Admin/gestor insert social metrics" ON public.social_metrics_daily FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin/gestor update social metrics" ON public.social_metrics_daily FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin/gestor delete social metrics" ON public.social_metrics_daily FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Service role full social metrics" ON public.social_metrics_daily FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============ CAMPANHAS METRICS DAILY ============
CREATE TABLE public.campanhas_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES public.campanhas_trafego(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  gastos NUMERIC(12,2) DEFAULT 0,
  impressoes INTEGER DEFAULT 0,
  cliques INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campanha_id, data)
);
ALTER TABLE public.campanhas_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor sees campanhas metrics" ON public.campanhas_metrics_daily FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin/gestor insert campanhas metrics" ON public.campanhas_metrics_daily FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin/gestor update campanhas metrics" ON public.campanhas_metrics_daily FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Admin/gestor delete campanhas metrics" ON public.campanhas_metrics_daily FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Service role full campanhas metrics" ON public.campanhas_metrics_daily FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============ NOTAS (polimórficas) ============
CREATE TABLE public.notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_tipo TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  conteudo TEXT NOT NULL,
  autor_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor sees notas" ON public.notas FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Author sees own notas" ON public.notas FOR SELECT TO authenticated
  USING (autor_id = auth.uid());
CREATE POLICY "Authenticated insert notas" ON public.notas FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid());
CREATE POLICY "Author or admin update notas" ON public.notas FOR UPDATE TO authenticated
  USING (autor_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));
CREATE POLICY "Author or admin delete notas" ON public.notas FOR DELETE TO authenticated
  USING (autor_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE INDEX idx_notas_entidade ON public.notas(entidade_tipo, entidade_id);
CREATE TRIGGER trg_notas_updated BEFORE UPDATE ON public.notas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SYSTEM SETTINGS ============
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin sees settings" ON public.system_settings FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin insert settings" ON public.system_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update settings" ON public.system_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete settings" ON public.system_settings FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();