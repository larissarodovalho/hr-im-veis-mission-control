-- Etapa 12: feedback do cliente e solicitação de visita nos links temporários

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
  _imovel uuid;
  _imovel_desc text;
  _motivo text;
  _pref text;
  _tarefa_titulo text;
BEGIN
  SELECT * INTO l FROM public.imovel_links_compartilhados WHERE id = NEW.link_id;
  IF l IS NULL THEN RETURN NEW; END IF;

  -- apresentação real só quando houve tentativa de compartilhamento
  IF NEW.tipo_evento IN ('envio_whatsapp_iniciado','envio_confirmado','compartilhamento_nativo_interno') THEN
    PERFORM public.imovel_link_marcar_apresentado(l.id, l.corretor_id);
  END IF;

  _motivo := NULLIF(btrim(COALESCE(NEW.metadata->>'motivo','')), '');
  _pref := NULLIF(btrim(COALESCE(NEW.metadata->>'preferencia','')), '');

  -- Imóvel do item (quando o evento é por imóvel)
  IF NEW.item_id IS NOT NULL THEN
    SELECT it.imovel_id INTO _imovel FROM public.imovel_link_itens it WHERE it.id = NEW.item_id;
  END IF;
  IF _imovel IS NOT NULL THEN
    SELECT COALESCE(i.codigo || ' — ', '') || i.titulo INTO _imovel_desc
    FROM public.imoveis i WHERE i.id = _imovel;
  END IF;

  -- Reflete o feedback no vínculo da oportunidade
  IF l.oportunidade_id IS NOT NULL AND _imovel IS NOT NULL
     AND NEW.tipo_evento IN ('gostei','rejeitou') THEN
    INSERT INTO public.oportunidade_imoveis (
      oportunidade_id, imovel_id, status, feedback_cliente, motivo_rejeicao,
      interesse, apresentado_em, apresentado_por, created_by
    )
    VALUES (
      l.oportunidade_id, _imovel,
      CASE WHEN NEW.tipo_evento = 'rejeitou' THEN 'rejeitado' ELSE 'apresentado' END,
      CASE WHEN NEW.tipo_evento = 'rejeitou' THEN 'Não tenho interesse' ELSE 'Gostei' END,
      CASE WHEN NEW.tipo_evento = 'rejeitou' THEN _motivo ELSE NULL END,
      CASE WHEN NEW.tipo_evento = 'gostei' THEN 'alto' ELSE NULL END,
      now(), l.corretor_id, l.corretor_id
    )
    ON CONFLICT (oportunidade_id, imovel_id) DO UPDATE SET
      status = CASE WHEN NEW.tipo_evento = 'rejeitou' THEN 'rejeitado' ELSE 'apresentado' END,
      feedback_cliente = EXCLUDED.feedback_cliente,
      motivo_rejeicao = CASE WHEN NEW.tipo_evento = 'rejeitou'
                             THEN COALESCE(EXCLUDED.motivo_rejeicao, public.oportunidade_imoveis.motivo_rejeicao)
                             ELSE public.oportunidade_imoveis.motivo_rejeicao END,
      interesse = CASE WHEN NEW.tipo_evento = 'gostei' THEN 'alto' ELSE public.oportunidade_imoveis.interesse END,
      apresentado_em = COALESCE(public.oportunidade_imoveis.apresentado_em, now());
  END IF;

  IF l.conta_id IS NULL AND l.oportunidade_id IS NULL THEN RETURN NEW; END IF;

  _itens := COALESCE(_imovel_desc, public.imovel_link_descricao_itens(l.id));

  -- Tarefa de retorno ao cliente (sem duplicar por link/evento)
  IF NEW.tipo_evento IN ('solicitou_informacoes','solicitou_visita','gostei') THEN
    _tarefa_titulo := CASE NEW.tipo_evento
      WHEN 'solicitou_visita' THEN 'Retornar: cliente pediu visita pelo link'
      WHEN 'solicitou_informacoes' THEN 'Retornar: cliente pediu informações pelo link'
      ELSE 'Retornar: cliente curtiu imóvel no link'
    END;

    IF NOT EXISTS (
      SELECT 1 FROM public.tarefas t
      WHERE t.status <> 'concluida'
        AND t.titulo = _tarefa_titulo
        AND t.descricao LIKE '%' || l.codigo_referencia || '%'
        AND (_imovel_desc IS NULL OR t.descricao LIKE '%' || _imovel_desc || '%')
    ) THEN
      INSERT INTO public.tarefas (titulo, descricao, conta_id, oportunidade_id, responsavel_id, created_by, prazo, prioridade, status)
      VALUES (
        _tarefa_titulo,
        _itens || COALESCE(' — preferência: ' || _pref, '') || COALESCE(' — motivo: ' || _motivo, '')
          || ' (ref. ' || l.codigo_referencia || ')',
        l.conta_id, l.oportunidade_id, l.corretor_id, l.corretor_id,
        now() + interval '4 hours',
        CASE WHEN NEW.tipo_evento = 'solicitou_visita' THEN 'alta' ELSE 'media' END,
        'pendente'
      );
    END IF;
  END IF;

  CASE NEW.tipo_evento
    WHEN 'envio_whatsapp_iniciado' THEN _desc := 'Compartilhamento do link iniciado por WhatsApp — ' || _itens; _unico := true;
    WHEN 'envio_confirmado' THEN _desc := 'Envio do link confirmado pelo corretor — ' || _itens; _unico := true;
    WHEN 'abertura' THEN _desc := 'Cliente abriu o link temporário — ' || _itens; _unico := true;
    WHEN 'gostei' THEN _desc := 'Cliente marcou "gostei" — ' || _itens;
    WHEN 'rejeitou' THEN _desc := 'Cliente não tem interesse — ' || _itens || COALESCE(' (motivo: ' || _motivo || ')', '');
    WHEN 'solicitou_informacoes' THEN _desc := 'Cliente solicitou informações pelo link — ' || _itens;
    WHEN 'solicitou_visita' THEN _desc := 'Cliente solicitou visita pelo link — ' || _itens || COALESCE(' (preferência: ' || _pref || ')', '');
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