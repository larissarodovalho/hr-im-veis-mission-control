
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  link_id uuid,
  imovel_id uuid,
  conta_id uuid,
  oportunidade_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  chave_unica text,
  lida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notificacoes TO authenticated;
GRANT ALL ON public.notificacoes TO service_role;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX notificacoes_chave_unica_idx
  ON public.notificacoes (user_id, chave_unica) WHERE chave_unica IS NOT NULL;
CREATE INDEX notificacoes_user_created_idx ON public.notificacoes (user_id, created_at DESC);

CREATE POLICY "notificacoes_select_proprias" ON public.notificacoes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'));
CREATE POLICY "notificacoes_update_proprias" ON public.notificacoes
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notificacoes_delete_proprias" ON public.notificacoes
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.notificacao_preferencias (
  user_id uuid PRIMARY KEY,
  link_primeiro_acesso boolean NOT NULL DEFAULT true,
  link_feedback boolean NOT NULL DEFAULT true,
  link_expirou_sem_abertura boolean NOT NULL DEFAULT true,
  imovel_indisponivel boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notificacao_preferencias TO authenticated;
GRANT ALL ON public.notificacao_preferencias TO service_role;
ALTER TABLE public.notificacao_preferencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs_select_proprias" ON public.notificacao_preferencias
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "prefs_insert_proprias" ON public.notificacao_preferencias
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "prefs_update_proprias" ON public.notificacao_preferencias
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Helper: cria notificação respeitando a preferência do usuário e a idempotência
CREATE OR REPLACE FUNCTION public.criar_notificacao(
  _user_id uuid, _tipo text, _titulo text, _descricao text,
  _link_id uuid DEFAULT NULL, _imovel_id uuid DEFAULT NULL,
  _conta_id uuid DEFAULT NULL, _oportunidade_id uuid DEFAULT NULL,
  _chave text DEFAULT NULL, _pref text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _ok boolean := true;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  IF _pref IS NOT NULL THEN
    EXECUTE format('SELECT COALESCE((SELECT %I FROM public.notificacao_preferencias WHERE user_id = $1), true)', _pref)
      INTO _ok USING _user_id;
    IF NOT _ok THEN RETURN; END IF;
  END IF;
  INSERT INTO public.notificacoes (user_id, tipo, titulo, descricao, link_id, imovel_id, conta_id, oportunidade_id, chave_unica)
  VALUES (_user_id, _tipo, _titulo, _descricao, _link_id, _imovel_id, _conta_id, _oportunidade_id, _chave)
  ON CONFLICT DO NOTHING;
END; $$;

-- Notificações dos eventos dos links temporários
CREATE OR REPLACE FUNCTION public.notificar_link_evento()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  l record; _conta text; _quando text; _titulo text; _desc text;
  _tipo text; _pref text; _chave text; _imovel uuid; _imovel_desc text;
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
    -- somente o primeiro acesso gera aviso
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
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notificar_link_evento ON public.imovel_link_eventos;
CREATE TRIGGER trg_notificar_link_evento
AFTER INSERT ON public.imovel_link_eventos
FOR EACH ROW EXECUTE FUNCTION public.notificar_link_evento();

-- Imóvel de um link ativo virou vendido/indisponível
CREATE OR REPLACE FUNCTION public.notificar_imovel_indisponivel()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l record;
BEGIN
  IF COALESCE(NEW.status,'') = COALESCE(OLD.status,'') THEN RETURN NEW; END IF;
  IF lower(COALESCE(NEW.status,'')) NOT IN ('vendido','indisponível','indisponivel','reservado') THEN RETURN NEW; END IF;

  FOR l IN
    SELECT DISTINCT lc.*
    FROM public.imovel_links_compartilhados lc
    JOIN public.imovel_link_itens it ON it.link_id = lc.id
    WHERE it.imovel_id = NEW.id
      AND lc.estado_operacional = 'ativo'
      AND (lc.expira_em IS NULL OR lc.expira_em > now())
  LOOP
    PERFORM public.criar_notificacao(
      l.corretor_id, 'link_imovel_indisponivel',
      'Imóvel do link ficou ' || NEW.status,
      COALESCE(NEW.codigo || ' — ', '') || NEW.titulo || ' está em um link ativo (ref. ' || l.codigo_referencia || ').',
      l.id, NEW.id, l.conta_id, l.oportunidade_id,
      'imovel_indisponivel:' || l.id::text || ':' || NEW.id::text, 'imovel_indisponivel'
    );
  END LOOP;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notificar_imovel_indisponivel ON public.imoveis;
CREATE TRIGGER trg_notificar_imovel_indisponivel
AFTER UPDATE OF status ON public.imoveis
FOR EACH ROW EXECUTE FUNCTION public.notificar_imovel_indisponivel();

-- Expiração sem abertura também notifica o corretor
CREATE OR REPLACE FUNCTION public.imovel_links_expirados_sem_abertura()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l record; n integer := 0;
BEGIN
  IF NOT public.is_staff() THEN RETURN 0; END IF;
  FOR l IN
    SELECT * FROM public.imovel_links_compartilhados
    WHERE expiracao_notificada_em IS NULL
      AND primeiro_acesso_em IS NULL
      AND expira_em IS NOT NULL AND expira_em <= now()
    LIMIT 200
  LOOP
    IF l.conta_id IS NOT NULL OR l.oportunidade_id IS NOT NULL THEN
      INSERT INTO public.interacoes (conta_id, oportunidade_id, tipo, canal, descricao, created_by)
      VALUES (l.conta_id, l.oportunidade_id, 'link_imovel', 'link',
              'Link temporário expirou sem nenhuma abertura — ' || public.imovel_link_descricao_itens(l.id)
              || ' (ref. ' || l.codigo_referencia || ')', l.corretor_id);
    END IF;

    PERFORM public.criar_notificacao(
      l.corretor_id, 'link_expirou_sem_abertura',
      'Link ' || l.codigo_referencia || ' expirou sem abertura',
      'O link ' || l.codigo_referencia || ' expirou e não foi aberto nenhuma vez.',
      l.id, NULL, l.conta_id, l.oportunidade_id,
      'link_expirou:' || l.id::text, 'link_expirou_sem_abertura'
    );

    UPDATE public.imovel_links_compartilhados SET expiracao_notificada_em = now() WHERE id = l.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END; $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
