-- Etapa 10: integração dos links temporários com Contas, Oportunidades e histórico

ALTER TABLE public.interacoes DROP CONSTRAINT IF EXISTS interacoes_tipo_check;
ALTER TABLE public.interacoes
  ADD CONSTRAINT interacoes_tipo_check
  CHECK (tipo = ANY (ARRAY['ligacao','mensagem','audio','visita','reuniao','email','nota','whatsapp_ia','followup_manual','link_imovel']));

ALTER TABLE public.imovel_links_compartilhados
  ADD COLUMN IF NOT EXISTS expiracao_notificada_em timestamptz;

-- Descrição dos imóveis do link (código/título), sem dados internos
CREATE OR REPLACE FUNCTION public.imovel_link_descricao_itens(_link_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(string_agg(COALESCE(i.codigo || ' — ', '') || i.titulo, '; ' ORDER BY it.ordem), 'imóvel')
  FROM public.imovel_link_itens it
  JOIN public.imoveis i ON i.id = it.imovel_id
  WHERE it.link_id = _link_id;
$$;

-- Marca os imóveis do link como apresentados na oportunidade (sem duplicar)
CREATE OR REPLACE FUNCTION public.imovel_link_marcar_apresentado(_link_id uuid, _por uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _op uuid;
BEGIN
  SELECT oportunidade_id INTO _op FROM public.imovel_links_compartilhados WHERE id = _link_id;
  IF _op IS NULL THEN RETURN; END IF;

  INSERT INTO public.oportunidade_imoveis (oportunidade_id, imovel_id, status, apresentado_em, apresentado_por, created_by)
  SELECT _op, it.imovel_id, 'apresentado', now(), _por, _por
  FROM public.imovel_link_itens it
  WHERE it.link_id = _link_id
  ON CONFLICT (oportunidade_id, imovel_id) DO UPDATE
    SET status = CASE WHEN public.oportunidade_imoveis.status = 'rejeitado'
                      THEN public.oportunidade_imoveis.status ELSE 'apresentado' END,
        apresentado_em = COALESCE(public.oportunidade_imoveis.apresentado_em, now()),
        apresentado_por = COALESCE(public.oportunidade_imoveis.apresentado_por, _por);
END;
$$;

-- Interação de "link gerado"
CREATE OR REPLACE FUNCTION public.imovel_link_log_criacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.conta_id IS NULL AND NEW.oportunidade_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.interacoes (conta_id, oportunidade_id, tipo, canal, descricao, created_by)
  VALUES (NEW.conta_id, NEW.oportunidade_id, 'link_imovel', 'link',
          'Link temporário gerado (ref. ' || NEW.codigo_referencia || ')', NEW.created_by);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_imovel_link_log_criacao ON public.imovel_links_compartilhados;
CREATE TRIGGER trg_imovel_link_log_criacao
AFTER INSERT ON public.imovel_links_compartilhados
FOR EACH ROW EXECUTE FUNCTION public.imovel_link_log_criacao();

-- Eventos do link -> linha do tempo + oportunidade_imoveis
CREATE OR REPLACE FUNCTION public.imovel_link_evento_comercial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l record;
  _desc text;
  _unico boolean := false;
  _itens text;
BEGIN
  SELECT * INTO l FROM public.imovel_links_compartilhados WHERE id = NEW.link_id;
  IF l IS NULL THEN RETURN NEW; END IF;

  -- apresentação real só quando houve tentativa de compartilhamento
  IF NEW.tipo_evento IN ('envio_whatsapp_iniciado','envio_confirmado','compartilhamento_nativo_interno') THEN
    PERFORM public.imovel_link_marcar_apresentado(l.id, l.corretor_id);
  END IF;

  IF l.conta_id IS NULL AND l.oportunidade_id IS NULL THEN RETURN NEW; END IF;

  _itens := public.imovel_link_descricao_itens(l.id);

  CASE NEW.tipo_evento
    WHEN 'envio_whatsapp_iniciado' THEN _desc := 'Compartilhamento do link iniciado por WhatsApp — ' || _itens; _unico := true;
    WHEN 'envio_confirmado' THEN _desc := 'Envio do link confirmado pelo corretor — ' || _itens; _unico := true;
    WHEN 'abertura' THEN _desc := 'Cliente abriu o link temporário — ' || _itens; _unico := true;
    WHEN 'gostei' THEN _desc := 'Cliente marcou "gostei" — ' || _itens;
    WHEN 'rejeitou' THEN _desc := 'Cliente rejeitou o imóvel — ' || _itens;
    WHEN 'solicitou_informacoes' THEN _desc := 'Cliente solicitou informações pelo link — ' || _itens;
    WHEN 'solicitou_visita' THEN _desc := 'Cliente solicitou visita pelo link — ' || _itens;
    ELSE RETURN NEW;
  END CASE;

  IF _unico AND EXISTS (
    SELECT 1 FROM public.imovel_link_eventos e
    WHERE e.link_id = NEW.link_id AND e.tipo_evento = NEW.tipo_evento AND e.id <> NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.interacoes (conta_id, oportunidade_id, tipo, canal, descricao, created_by)
  VALUES (l.conta_id, l.oportunidade_id, 'link_imovel', 'link',
          _desc || ' (ref. ' || l.codigo_referencia || ')', l.corretor_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_imovel_link_evento_comercial ON public.imovel_link_eventos;
CREATE TRIGGER trg_imovel_link_evento_comercial
AFTER INSERT ON public.imovel_link_eventos
FOR EACH ROW EXECUTE FUNCTION public.imovel_link_evento_comercial();

-- Links expirados sem nenhuma abertura viram interação (executado sob demanda pelo CRM)
CREATE OR REPLACE FUNCTION public.imovel_links_expirados_sem_abertura()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l record;
  n integer := 0;
BEGIN
  IF NOT public.is_staff() THEN RETURN 0; END IF;
  FOR l IN
    SELECT * FROM public.imovel_links_compartilhados
    WHERE expiracao_notificada_em IS NULL
      AND primeiro_acesso_em IS NULL
      AND expira_em IS NOT NULL AND expira_em <= now()
      AND (conta_id IS NOT NULL OR oportunidade_id IS NOT NULL)
    LIMIT 200
  LOOP
    INSERT INTO public.interacoes (conta_id, oportunidade_id, tipo, canal, descricao, created_by)
    VALUES (l.conta_id, l.oportunidade_id, 'link_imovel', 'link',
            'Link temporário expirou sem nenhuma abertura — ' || public.imovel_link_descricao_itens(l.id)
            || ' (ref. ' || l.codigo_referencia || ')', l.corretor_id);
    UPDATE public.imovel_links_compartilhados SET expiracao_notificada_em = now() WHERE id = l.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.imovel_links_expirados_sem_abertura() TO authenticated;
GRANT EXECUTE ON FUNCTION public.imovel_link_descricao_itens(uuid) TO authenticated;