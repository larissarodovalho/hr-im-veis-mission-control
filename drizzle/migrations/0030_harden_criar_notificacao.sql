CREATE OR REPLACE FUNCTION public.criar_notificacao(_user_id uuid, _tipo text, _titulo text, _descricao text, _link_id uuid DEFAULT NULL::uuid, _imovel_id uuid DEFAULT NULL::uuid, _conta_id uuid DEFAULT NULL::uuid, _oportunidade_id uuid DEFAULT NULL::uuid, _chave text DEFAULT NULL::text, _pref text DEFAULT NULL::text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _ok boolean := true;
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  IF _pref IS NOT NULL THEN
    SELECT COALESCE((SELECT CASE _pref
        WHEN 'link_primeiro_acesso' THEN p.link_primeiro_acesso
        WHEN 'link_feedback' THEN p.link_feedback
        WHEN 'link_expirou_sem_abertura' THEN p.link_expirou_sem_abertura
        WHEN 'imovel_indisponivel' THEN p.imovel_indisponivel
        ELSE true END
      FROM public.notificacao_preferencias p WHERE p.user_id = _user_id), true) INTO _ok;
    IF NOT _ok THEN RETURN; END IF;
  END IF;
  INSERT INTO public.notificacoes (user_id, tipo, titulo, descricao, link_id, imovel_id, conta_id, oportunidade_id, chave_unica)
  VALUES (_user_id, _tipo, _titulo, _descricao, _link_id, _imovel_id, _conta_id, _oportunidade_id, _chave)
  ON CONFLICT DO NOTHING;
END; $function$;
REVOKE EXECUTE ON FUNCTION public.criar_notificacao(uuid,text,text,text,uuid,uuid,uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.criar_notificacao(uuid,text,text,text,uuid,uuid,uuid,uuid,text,text) TO service_role;