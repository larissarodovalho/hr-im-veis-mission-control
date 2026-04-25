-- ============ IMÓVEIS ============
CREATE TABLE public.imoveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'Casa',
  finalidade TEXT NOT NULL DEFAULT 'Venda',
  status TEXT NOT NULL DEFAULT 'Disponível',
  valor NUMERIC(14,2),
  valor_condominio NUMERIC(10,2),
  valor_iptu NUMERIC(10,2),
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  area_util NUMERIC(10,2),
  area_total NUMERIC(10,2),
  quartos INTEGER DEFAULT 0,
  suites INTEGER DEFAULT 0,
  banheiros INTEGER DEFAULT 0,
  vagas INTEGER DEFAULT 0,
  caracteristicas TEXT[] DEFAULT ARRAY[]::TEXT[],
  fotos TEXT[] DEFAULT ARRAY[]::TEXT[],
  destaque BOOLEAN NOT NULL DEFAULT false,
  corretor_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view available imoveis"
  ON public.imoveis FOR SELECT
  USING (status = 'Disponível');

CREATE POLICY "Staff sees all imoveis"
  ON public.imoveis FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'corretor')
  );

CREATE POLICY "Staff can create imoveis"
  ON public.imoveis FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'corretor'))
  );

CREATE POLICY "Owner or admin/gestor updates imoveis"
  ON public.imoveis FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR corretor_id = auth.uid()
  );

CREATE POLICY "Admin/gestor deletes imoveis"
  ON public.imoveis FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE TRIGGER trg_imoveis_updated BEFORE UPDATE ON public.imoveis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_imoveis_status ON public.imoveis(status);
CREATE INDEX idx_imoveis_corretor ON public.imoveis(corretor_id);

-- ============ VISITAS ============
CREATE TABLE public.visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  imovel_id UUID REFERENCES public.imoveis(id) ON DELETE SET NULL,
  corretor_id UUID,
  data_visita TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Agendada',
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor sees all visitas"
  ON public.visitas FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE POLICY "Corretor sees own visitas"
  ON public.visitas FOR SELECT TO authenticated
  USING (corretor_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Authenticated creates visitas"
  ON public.visitas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin/gestor updates visitas"
  ON public.visitas FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR corretor_id = auth.uid());

CREATE POLICY "Admin/gestor deletes visitas"
  ON public.visitas FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE TRIGGER trg_visitas_updated BEFORE UPDATE ON public.visitas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TAREFAS ============
CREATE TABLE public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  responsavel_id UUID,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  prioridade TEXT NOT NULL DEFAULT 'Média',
  status TEXT NOT NULL DEFAULT 'A fazer',
  prazo TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor sees all tarefas"
  ON public.tarefas FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE POLICY "User sees own tarefas"
  ON public.tarefas FOR SELECT TO authenticated
  USING (responsavel_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Authenticated creates tarefas"
  ON public.tarefas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin/gestor updates tarefas"
  ON public.tarefas FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR responsavel_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Admin/gestor deletes tarefas"
  ON public.tarefas FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE TRIGGER trg_tarefas_updated BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROPOSTAS ============
CREATE TABLE public.propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  imovel_id UUID REFERENCES public.imoveis(id) ON DELETE SET NULL,
  corretor_id UUID,
  valor NUMERIC(14,2),
  condicoes TEXT,
  status TEXT NOT NULL DEFAULT 'Em análise',
  observacoes TEXT,
  data_envio TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor sees all propostas"
  ON public.propostas FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE POLICY "Corretor sees own propostas"
  ON public.propostas FOR SELECT TO authenticated
  USING (corretor_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Authenticated creates propostas"
  ON public.propostas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner or admin/gestor updates propostas"
  ON public.propostas FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR corretor_id = auth.uid());

CREATE POLICY "Admin/gestor deletes propostas"
  ON public.propostas FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE TRIGGER trg_propostas_updated BEFORE UPDATE ON public.propostas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CONTEÚDO ============
CREATE TABLE public.conteudo_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  perfil TEXT,
  formato TEXT,
  tema TEXT,
  prioridade TEXT NOT NULL DEFAULT 'Média',
  status TEXT NOT NULL DEFAULT 'Ideia',
  data_planejada DATE,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conteudo_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor manage conteudo"
  ON public.conteudo_posts FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE TRIGGER trg_conteudo_updated BEFORE UPDATE ON public.conteudo_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CAMPANHAS DE TRÁFEGO ============
CREATE TABLE public.campanhas_trafego (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plataforma TEXT NOT NULL,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Ativa',
  budget NUMERIC(12,2) DEFAULT 0,
  gastos NUMERIC(12,2) DEFAULT 0,
  impressoes INTEGER DEFAULT 0,
  cliques INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  external_id TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campanhas_trafego ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gestor manage campanhas"
  ON public.campanhas_trafego FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor'));

CREATE TRIGGER trg_campanhas_updated BEFORE UPDATE ON public.campanhas_trafego
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORAGE: bucket de fotos de imóveis ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('imoveis', 'imoveis', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view imovel photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'imoveis');

CREATE POLICY "Staff can upload imovel photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'imoveis' AND (
      has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'corretor')
    )
  );

CREATE POLICY "Staff can update imovel photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'imoveis' AND (
      has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor') OR has_role(auth.uid(),'corretor')
    )
  );

CREATE POLICY "Admin/gestor can delete imovel photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'imoveis' AND (
      has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor')
    )
  );