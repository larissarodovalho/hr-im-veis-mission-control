-- ============ ENUM de papéis ============
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'corretor');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  avatar_url TEXT,
  cargo TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ Função has_role (security definer, sem recursão) ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ Função updated_at ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ Auto-criar profile + role ao cadastrar ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'corretor')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ Políticas profiles ============
CREATE POLICY "Users see own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins/gestores see all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  );
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Políticas user_roles ============
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins see all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ LEADS ============
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  origem TEXT,
  status TEXT NOT NULL DEFAULT 'Novo',
  etapa_funil TEXT NOT NULL DEFAULT 'Prospecção',
  qualificacao TEXT,
  valor_estimado NUMERIC,
  imovel_interesse TEXT,
  observacoes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  corretor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultima_interacao TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_leads_corretor ON public.leads(corretor_id);
CREATE INDEX idx_leads_etapa ON public.leads(etapa_funil);

CREATE POLICY "Admin/gestor see all leads" ON public.leads
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  );
CREATE POLICY "Corretor sees own leads" ON public.leads
  FOR SELECT TO authenticated USING (corretor_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Authenticated can create leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admin/gestor update any lead" ON public.leads
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  );
CREATE POLICY "Corretor updates own leads" ON public.leads
  FOR UPDATE TO authenticated USING (corretor_id = auth.uid());
CREATE POLICY "Admin/gestor delete leads" ON public.leads
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  );

CREATE TRIGGER trg_leads_updated
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ LEAD HISTÓRICO ============
CREATE TABLE public.lead_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  descricao TEXT,
  data TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_historico ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_hist_lead ON public.lead_historico(lead_id, data DESC);

CREATE POLICY "View historico of accessible leads" ON public.lead_historico
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id
      AND (public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'gestor')
        OR l.corretor_id = auth.uid()
        OR l.created_by = auth.uid()))
  );
CREATE POLICY "Insert historico if can access lead" ON public.lead_historico
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id
      AND (public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'gestor')
        OR l.corretor_id = auth.uid()
        OR l.created_by = auth.uid()))
  );

-- ============ CONTATOS ============
CREATE TABLE public.contatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  tipo TEXT NOT NULL DEFAULT 'Cliente',
  origem TEXT,
  cpf_cnpj TEXT,
  endereco TEXT,
  observacoes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_contatos_responsavel ON public.contatos(responsavel_id);

CREATE POLICY "Admin/gestor see all contatos" ON public.contatos
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  );
CREATE POLICY "Corretor sees own contatos" ON public.contatos
  FOR SELECT TO authenticated USING (responsavel_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Authenticated can create contatos" ON public.contatos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admin/gestor update any contato" ON public.contatos
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  );
CREATE POLICY "Corretor updates own contatos" ON public.contatos
  FOR UPDATE TO authenticated USING (responsavel_id = auth.uid());
CREATE POLICY "Admin/gestor delete contatos" ON public.contatos
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  );

CREATE TRIGGER trg_contatos_updated
BEFORE UPDATE ON public.contatos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();