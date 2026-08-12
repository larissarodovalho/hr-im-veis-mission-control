CREATE OR REPLACE FUNCTION public.carteira_cancelar_lote(_lote_id uuid, _motivo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lote carteira_lotes%ROWTYPE;
  v_atrib record;
  v_encerradas integer := 0;
  v_todos_cancelados boolean;
  v_resp uuid;
  v_resp_nome text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  SELECT * INTO v_lote FROM public.carteira_lotes WHERE id = _lote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lote não encontrado'; END IF;
  IF v_lote.status <> 'ativo' THEN RAISE EXCEPTION 'Só é possível cancelar lotes ativos'; END IF;

  FOR v_atrib IN SELECT * FROM public.carteira_atribuicoes
                   WHERE lote_id = _lote_id AND encerrada_em IS NULL LOOP

    UPDATE public.carteira_atribuicoes SET
      encerrada_em = now(),
      status = 'cancelado',
      motivo_encerramento = _motivo,
      updated_at = now()
    WHERE id = v_atrib.id;

    v_resp := v_atrib.responsavel_anterior_id;
    IF v_resp IS NULL THEN
      SELECT c.created_by INTO v_resp FROM public.contas c WHERE c.id = v_atrib.conta_id;
    END IF;
    IF v_resp = v_atrib.corretor_id THEN v_resp := NULL; END IF;

    UPDATE public.contas
       SET responsavel_id = v_resp,
           categoria = coalesce(v_atrib.categoria_anterior, categoria),
           data_entrada_carteira = v_atrib.data_entrada_carteira_anterior
     WHERE id = v_atrib.conta_id;

    DELETE FROM public.tarefas
     WHERE conta_id = v_atrib.conta_id
       AND titulo = 'Primeiro contato — carteira'
       AND status <> 'Concluída';

    SELECT coalesce(p.nome, p.email) INTO v_resp_nome FROM public.profiles p WHERE p.user_id = v_resp;

    INSERT INTO public.carteira_eventos (
      atribuicao_id, operacao_id, conta_id, lote_id, tipo,
      responsavel_anterior_id, responsavel_novo_id, gestor_id, status_anterior, status_novo,
      motivo, observacao, created_by
    ) VALUES (
      v_atrib.id, v_lote.operacao_id, v_atrib.conta_id, _lote_id, 'cancelamento_lote',
      v_atrib.corretor_id, v_resp, auth.uid(), v_atrib.status, 'cancelado',
      _motivo,
      'Lote cancelado pelo gestor. Conta devolvida à base original' ||
        coalesce(' (responsável: ' || v_resp_nome || ')', ' (sem responsável)') || '.',
      auth.uid()
    );

    INSERT INTO public.interacoes (conta_id, atribuicao_id, tipo, descricao, resultado, created_by)
    VALUES (v_atrib.conta_id, v_atrib.id, 'nota',
            'Lote de carteira cancelado. Conta devolvida à base original' ||
              coalesce(' para ' || v_resp_nome, ' sem responsável') || '.',
            'carteira_cancelamento', auth.uid());

    v_encerradas := v_encerradas + 1;
  END LOOP;

  UPDATE public.carteira_lotes SET status = 'cancelado', updated_at = now()
  WHERE id = _lote_id;

  SELECT bool_and(status = 'cancelado') INTO v_todos_cancelados
    FROM public.carteira_lotes WHERE operacao_id = v_lote.operacao_id;
  IF v_todos_cancelados THEN
    UPDATE public.carteira_operacoes SET status = 'cancelada', updated_at = now()
    WHERE id = v_lote.operacao_id;
  END IF;

  RETURN jsonb_build_object('encerradas', v_encerradas);
END;
$function$;

REVOKE ALL ON FUNCTION public.carteira_cancelar_lote(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.carteira_cancelar_lote(uuid, text) TO authenticated;