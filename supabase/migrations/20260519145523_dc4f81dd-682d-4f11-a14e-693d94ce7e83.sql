
-- 1. imoveis_public view (safe columns only)
CREATE OR REPLACE VIEW public.imoveis_public
WITH (security_invoker = on) AS
SELECT
  id, codigo, titulo, descricao, tipo, finalidade, status,
  valor, valor_condominio, valor_iptu,
  quartos, suites, banheiros, vagas,
  area_total, area_util, area_construida,
  caracteristicas, fotos, destaque,
  endereco, numero, complemento, bairro, cidade, estado, cep,
  created_at, updated_at
FROM public.imoveis
WHERE status = 'Disponível';

GRANT SELECT ON public.imoveis_public TO anon, authenticated;

-- 2. Drop public anon access to base table
DROP POLICY IF EXISTS "Public can view available imoveis" ON public.imoveis;

-- 3. Tighten INSERT policies — require staff
DROP POLICY IF EXISTS "Authenticated creates contas" ON public.contas;
CREATE POLICY "Staff creates contas" ON public.contas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_staff());

DROP POLICY IF EXISTS "Authenticated can create contatos" ON public.contatos;
CREATE POLICY "Staff creates contatos" ON public.contatos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_staff());

DROP POLICY IF EXISTS "Authenticated creates interacoes" ON public.interacoes;
CREATE POLICY "Staff creates interacoes" ON public.interacoes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_staff());

DROP POLICY IF EXISTS "Authenticated creates ligacoes" ON public.ligacoes;
CREATE POLICY "Staff creates ligacoes" ON public.ligacoes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_staff());

DROP POLICY IF EXISTS "Authenticated creates propostas" ON public.propostas;
CREATE POLICY "Staff creates propostas" ON public.propostas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_staff());

DROP POLICY IF EXISTS "Authenticated creates reunioes" ON public.reunioes;
CREATE POLICY "Staff creates reunioes" ON public.reunioes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_staff());

DROP POLICY IF EXISTS "Authenticated creates tarefas" ON public.tarefas;
CREATE POLICY "Staff creates tarefas" ON public.tarefas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_staff());

DROP POLICY IF EXISTS "Authenticated creates visitas" ON public.visitas;
CREATE POLICY "Staff creates visitas" ON public.visitas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND public.is_staff());

-- 4. Allow corretores to read notas on their own leads / contas
CREATE POLICY "Corretor sees notas on own leads/contas"
  ON public.notas FOR SELECT TO authenticated
  USING (
    (entidade_tipo = 'lead' AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = notas.entidade_id
        AND (l.corretor_id = auth.uid() OR l.created_by = auth.uid())
    ))
    OR (entidade_tipo = 'conta' AND EXISTS (
      SELECT 1 FROM public.contas c
      WHERE c.id = notas.entidade_id
        AND (c.responsavel_id = auth.uid() OR c.created_by = auth.uid())
    ))
  );
