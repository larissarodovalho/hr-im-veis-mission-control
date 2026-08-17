CREATE OR REPLACE FUNCTION public.notificar_link_evento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l record; _conta text; _quando text; _titulo text; _desc text;
  _tipo text; _pref text; _chave text; _imovel uuid; _imovel_desc text;
  _tarefa_titulo text; _prazo timestamptz; _prio text;
BEGIN
  SELECT * INTO l FROM public.imovel_links_compartilhados WHERE id = NEW.link_id;
  IF l IS NULL THEN RETURN NEW; END IF;

  IF NEW.item_id IS NOT NULL THEN
    SELECT it.imovel_id INTO _imovel FROM public.imovel_link_itens it WHERE it.id = NEW.item_id;
  END IF;
  IF _imovel IS NOT NULL THEN
    SELECT COALESCE(i.codigo || ' — ', '') || i.titulo INTO _imovel_desc FROM public.imoveis i WHERE i.id = _imovel;
  END IF;

  IF l.conta_id IS NOT NULL THEN
    SELECT c.nome INTO _conta FROM public.contas c WHERE c.id = l.conta_id;
  END IF;
  _quando := to_char(NEW.created_at AT TIME ZONE 'America/Cuiaba', 'DD/MM HH24:MI');

  IF NEW.tipo_evento = 'abertura' THEN
    IF EXISTS (
      SELECT 1 FROM public.imovel_link_eventos e
      WHERE e.link_id = NEW.link_id AND e.tipo_evento = 'abertura' AND e.id <> NEW.id
    ) THEN RETURN NEW; END IF;
    _tipo := 'link_primeiro_acesso';
    _pref := 'link_primeiro_acesso';
    _titulo := 'Link ' || l.codigo_referencia || ' foi aberto';
    _desc := CASE WHEN _conta IS NOT NULL
      THEN 'O link do imóvel ' || l.codigo_referencia || ', gerado para ' || _conta || ', foi aberto às ' || _quando || '.'
      ELSE 'O link do imóvel ' || l.codigo_referencia || ' recebeu um primeiro acesso às ' || _quando || '.' END;
    _chave := 'link_abertura:' || l.id::text;
  ELSIF NEW.tipo_evento IN ('gostei','rejeitou','solicitou_informacoes','solicitou_visita') THEN
    _tipo := 'link_' || NEW.tipo_evento;
    _pref := 'link_feedback';
    _titulo := CASE NEW.tipo_evento
      WHEN 'gostei' THEN 'Cliente curtiu um imóvel'
      WHEN 'rejeitou' THEN 'Cliente sem interesse'
      WHEN 'solicitou_informacoes' THEN 'Cliente pediu informações'
      ELSE 'Cliente pediu uma visita' END;
    _desc := COALESCE(_conta || ' — ', '') || COALESCE(_imovel_desc, 'imóveis do link')
      || ' (ref. ' || l.codigo_referencia || ') às ' || _quando || '.';
    _chave := NEW.tipo_evento || ':' || NEW.id::text;
  ELSE
    RETURN NEW;
  END IF;

  PERFORM public.criar_notificacao(
    l.corretor_id, _tipo, _titulo, _desc, l.id, _imovel, l.conta_id, l.oportunidade_id, _chave, _pref
  );

  IF NEW.tipo_evento IN ('gostei','solicitou_informacoes','solicitou_visita') THEN
    _tarefa_titulo := CASE NEW.tipo_evento
      WHEN 'solicitou_visita' THEN 'Agendar visita solicitada no link ' || l.codigo_referencia
      WHEN 'solicitou_informacoes' THEN 'Enviar informações pedidas no link ' || l.codigo_referencia
      ELSE 'Retornar contato - cliente curtiu imovel (link ' || l.codigo_referencia || ')' END;
    _prazo := CASE NEW.tipo_evento
      WHEN 'solicitou_visita' THEN now() + interval '4 hours'
      WHEN 'solicitou_informacoes' THEN now() + interval '6 hours'
      ELSE now() + interval '1 day' END;
    _prio := CASE WHEN NEW.tipo_evento = 'gostei' THEN 'Média' ELSE 'Alta' END;

    IF NOT EXISTS (
      SELECT 1 FROM public.tarefas t
      WHERE t.responsavel_id = l.corretor_id
        AND t.titulo = _tarefa_titulo
        AND t.status <> 'Concluída'
        AND t.created_at > now() - interval '2 days'
    ) THEN
      INSERT INTO public.tarefas (titulo, descricao, responsavel_id, created_by, prioridade, status, prazo, conta_id, oportunidade_id)
      VALUES (_tarefa_titulo, _desc, l.corretor_id, l.corretor_id, _prio, 'A fazer', _prazo, l.conta_id, l.oportunidade_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;