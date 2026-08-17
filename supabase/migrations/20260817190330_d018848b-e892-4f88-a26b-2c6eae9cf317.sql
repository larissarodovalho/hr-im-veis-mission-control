
-- 1) Helper: quem pode enxergar um link (mesma matriz da tabela de links)
CREATE OR REPLACE FUNCTION public.imovel_link_pode_ver(_link_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.imovel_links_compartilhados l
    WHERE l.id = _link_id
      AND (
        public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')
        OR public.has_role(auth.uid(),'marketing')
        OR l.corretor_id = auth.uid() OR l.created_by = auth.uid()
      )
  )
$$;

-- 2) Escopo explícito nas tabelas satélite (secretaria fica de fora)
DROP POLICY IF EXISTS "Eventos visiveis conforme link" ON public.imovel_link_eventos;
CREATE POLICY "Eventos visiveis conforme link" ON public.imovel_link_eventos
  FOR SELECT TO authenticated USING (public.imovel_link_pode_ver(link_id));

DROP POLICY IF EXISTS "Staff insert share eventos" ON public.imovel_link_eventos;
CREATE POLICY "Staff insert share eventos" ON public.imovel_link_eventos
  FOR INSERT TO authenticated WITH CHECK (public.imovel_link_pode_ver(link_id));

DROP POLICY IF EXISTS "Itens visiveis conforme link" ON public.imovel_link_itens;
CREATE POLICY "Itens visiveis conforme link" ON public.imovel_link_itens
  FOR SELECT TO authenticated USING (public.imovel_link_pode_ver(link_id));

DROP POLICY IF EXISTS "Staff gerencia itens de link" ON public.imovel_link_itens;
CREATE POLICY "Staff gerencia itens de link" ON public.imovel_link_itens
  FOR ALL TO authenticated
  USING (public.imovel_link_pode_ver(link_id))
  WITH CHECK (public.imovel_link_pode_ver(link_id));

-- Auditoria: leitura só para admin/gestor; ninguém edita ou apaga pelo app
DROP POLICY IF EXISTS "Staff read link auditoria" ON public.imovel_link_auditoria;
CREATE POLICY "Gestao le auditoria de links" ON public.imovel_link_auditoria
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'));

-- Configuração pública do imóvel: secretaria não altera apresentação
DROP POLICY IF EXISTS "Staff manage apresentacao config" ON public.imovel_apresentacao_config;
CREATE POLICY "Comercial gerencia apresentacao publica" ON public.imovel_apresentacao_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')
         OR public.has_role(auth.uid(),'marketing') OR public.has_role(auth.uid(),'corretor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')
         OR public.has_role(auth.uid(),'marketing') OR public.has_role(auth.uid(),'corretor'));

-- 3) Endereço completo só com autorização de admin/gestor
CREATE OR REPLACE FUNCTION public.imovel_link_valida_endereco()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _loc text;
BEGIN
  IF TG_TABLE_NAME = 'imovel_apresentacao_config' THEN
    _loc := NEW.localizacao_padrao;
  ELSE
    _loc := NEW.configuracao_publica->>'localizacao';
  END IF;

  IF _loc = 'endereco_completo'
     AND NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')) THEN
    RAISE EXCEPTION 'Exibir o endereço completo exige autorização de admin ou gestor';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_endereco_config ON public.imovel_apresentacao_config;
CREATE TRIGGER trg_endereco_config BEFORE INSERT OR UPDATE ON public.imovel_apresentacao_config
  FOR EACH ROW EXECUTE FUNCTION public.imovel_link_valida_endereco();

DROP TRIGGER IF EXISTS trg_endereco_item ON public.imovel_link_itens;
CREATE TRIGGER trg_endereco_item BEFORE INSERT OR UPDATE ON public.imovel_link_itens
  FOR EACH ROW EXECUTE FUNCTION public.imovel_link_valida_endereco();

-- 4) Auditoria de todo o ciclo de vida (nunca grava o token completo)
CREATE OR REPLACE FUNCTION public.imovel_link_auditar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _acao text; _antes jsonb; _depois jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _acao := CASE WHEN NEW.substitui_link_id IS NOT NULL THEN 'regeneracao' ELSE 'criacao' END;
    _depois := jsonb_build_object('codigo_referencia', NEW.codigo_referencia, 'tipo', NEW.tipo,
      'validade_minutos', NEW.validade_minutos, 'inicio_validade', NEW.inicio_validade,
      'configuracao_publica', NEW.configuracao_publica, 'substitui_link_id', NEW.substitui_link_id);
    INSERT INTO public.imovel_link_auditoria (link_id, acao, dados_novos, executado_por)
    VALUES (NEW.id, _acao, _depois, COALESCE(auth.uid(), NEW.created_by));
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.imovel_link_auditoria (link_id, acao, dados_anteriores, executado_por)
    VALUES (OLD.id, 'exclusao_administrativa',
      jsonb_build_object('codigo_referencia', OLD.codigo_referencia, 'corretor_id', OLD.corretor_id,
                         'estado_operacional', OLD.estado_operacional), auth.uid());
    RETURN OLD;
  END IF;

  IF NEW.estado_operacional IS DISTINCT FROM OLD.estado_operacional THEN
    _acao := CASE NEW.estado_operacional
               WHEN 'revogado' THEN 'revogacao'
               WHEN 'substituido' THEN 'substituicao'
               WHEN 'expirado' THEN 'expiracao'
               ELSE 'mudanca_estado' END;
    INSERT INTO public.imovel_link_auditoria (link_id, acao, dados_anteriores, dados_novos, executado_por)
    VALUES (NEW.id, _acao,
      jsonb_build_object('estado_operacional', OLD.estado_operacional),
      jsonb_build_object('estado_operacional', NEW.estado_operacional, 'motivo', NEW.motivo_revogacao),
      COALESCE(auth.uid(), NEW.revogado_por));
  END IF;

  IF NEW.compartilhado_em IS DISTINCT FROM OLD.compartilhado_em AND NEW.compartilhado_em IS NOT NULL THEN
    INSERT INTO public.imovel_link_auditoria (link_id, acao, dados_novos, executado_por)
    VALUES (NEW.id, 'compartilhamento',
      jsonb_build_object('canal', NEW.canal_compartilhamento, 'em', NEW.compartilhado_em), auth.uid());
  END IF;

  IF NEW.configuracao_publica IS DISTINCT FROM OLD.configuracao_publica THEN
    INSERT INTO public.imovel_link_auditoria (link_id, acao, dados_anteriores, dados_novos, executado_por)
    VALUES (NEW.id, 'alteracao_config_publica', OLD.configuracao_publica, NEW.configuracao_publica, auth.uid());
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_link_auditar ON public.imovel_links_compartilhados;
CREATE TRIGGER trg_link_auditar
  AFTER INSERT OR UPDATE OR DELETE ON public.imovel_links_compartilhados
  FOR EACH ROW EXECUTE FUNCTION public.imovel_link_auditar();

-- Auditoria preservada mesmo se o link for excluído: solta a FK em cascata
ALTER TABLE public.imovel_link_auditoria DROP CONSTRAINT IF EXISTS imovel_link_auditoria_link_id_fkey;

-- 5) Rate limit do endpoint público (somente a Edge Function acessa)
CREATE TABLE IF NOT EXISTS public.imovel_link_rate_limit (
  chave text PRIMARY KEY,
  janela_inicio timestamptz NOT NULL DEFAULT now(),
  contador integer NOT NULL DEFAULT 0
);
GRANT ALL ON public.imovel_link_rate_limit TO service_role;
ALTER TABLE public.imovel_link_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.imovel_link_rate_ok(_chave text, _limite integer, _janela_seg integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _row public.imovel_link_rate_limit;
BEGIN
  INSERT INTO public.imovel_link_rate_limit (chave, janela_inicio, contador)
  VALUES (_chave, now(), 1)
  ON CONFLICT (chave) DO UPDATE
    SET contador = CASE WHEN public.imovel_link_rate_limit.janela_inicio < now() - make_interval(secs => _janela_seg)
                        THEN 1 ELSE public.imovel_link_rate_limit.contador + 1 END,
        janela_inicio = CASE WHEN public.imovel_link_rate_limit.janela_inicio < now() - make_interval(secs => _janela_seg)
                        THEN now() ELSE public.imovel_link_rate_limit.janela_inicio END
  RETURNING * INTO _row;
  RETURN _row.contador <= _limite;
END; $$;

REVOKE EXECUTE ON FUNCTION public.imovel_link_rate_ok(text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.imovel_link_rate_ok(text,integer,integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.imovel_link_pode_ver(uuid) FROM PUBLIC, anon;
