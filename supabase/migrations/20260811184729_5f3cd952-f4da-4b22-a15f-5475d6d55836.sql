CREATE OR REPLACE FUNCTION public.carteira_editar_lote(
  _lote_id uuid,
  _corretor_id uuid,
  _quantidade integer,
  _prazo integer,
  _objetivo text,
  _observacoes text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote carteira_lotes%ROWTYPE;
  v_op_id uuid;
  v_corretor_nome text;
  v_selecionadas integer;
  v_excesso integer;
  v_removidas integer := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  SELECT * INTO v_lote FROM public.carteira_lotes WHERE id = _lote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lote não encontrado'; END IF;
  IF v_lote.status <> 'em_revisao' THEN RAISE EXCEPTION 'Só é possível editar lotes em revisão'; END IF;

  -- Validar que o corretor tem o perfil 'corretor'
  IF NOT public.has_role(_corretor_id, 'corretor'::app_role) THEN
    RAISE EXCEPTION 'O usuário selecionado não possui o perfil Corretor';
  END IF;

  -- Validar que não há outro lote com o mesmo corretor nesta operação
  IF EXISTS (SELECT 1 FROM public.carteira_lotes
              WHERE operacao_id = v_lote.operacao_id
                AND id <> _lote_id
                AND corretor_id = _corretor_id) THEN
    RAISE EXCEPTION 'Já existe outro lote com este corretor nesta distribuição';
  END IF;

  -- Validar quantidade mínima
  IF _quantidade < 1 THEN RAISE EXCEPTION 'A quantidade deve ser maior que zero'; END IF;
  IF _prazo < 1 THEN RAISE EXCEPTION 'O prazo deve ser maior que zero'; END IF;

  -- Calcular quantas contas estão selecionadas neste lote
  SELECT count(*) INTO v_selecionadas FROM public.carteira_selecao_itens WHERE lote_id = _lote_id;

  -- Se a nova quantidade é menor, remover as excedentes (últimas adicionadas)
  IF v_selecionadas > _quantidade THEN
    v_excesso := v_selecionadas - _quantidade;
    DELETE FROM public.carteira_selecao_itens
     WHERE id IN (
       SELECT id FROM public.carteira_selecao_itens
        WHERE lote_id = _lote_id
        ORDER BY created_at DESC
        LIMIT v_excesso
     );
    v_removidas := v_excesso;
  END IF;

  -- Se o corretor mudou, regenerar o nome do lote
  IF v_lote.corretor_id <> _corretor_id THEN
    SELECT coalesce(p.nome, p.email, 'Corretor') INTO v_corretor_nome
      FROM public.profiles p WHERE p.user_id = _corretor_id;

    UPDATE public.carteira_lotes SET
      corretor_id = _corretor_id,
      nome = 'Carteira – ' || v_corretor_nome || ' – Lote ' || lpad(v_lote.numero::text, 2, '0'),
      quantidade_definida = _quantidade,
      prazo_primeiro_contato_dias = _prazo,
      objetivo = _objetivo,
      observacoes_internas = _observacoes,
      updated_at = now()
    WHERE id = _lote_id;
  ELSE
    UPDATE public.carteira_lotes SET
      quantidade_definida = _quantidade,
      prazo_primeiro_contato_dias = _prazo,
      objetivo = _objetivo,
      observacoes_internas = _observacoes,
      updated_at = now()
    WHERE id = _lote_id;
  END IF;

  -- Atualizar total_definido da operação
  UPDATE public.carteira_operacoes SET
    total_definido = (SELECT coalesce(sum(quantidade_definida), 0) FROM public.carteira_lotes WHERE operacao_id = v_lote.operacao_id),
    updated_at = now()
  WHERE id = v_lote.operacao_id;

  RETURN jsonb_build_object('ok', true, 'removidas', v_removidas);
END;
$$;

CREATE OR REPLACE FUNCTION public.carteira_excluir_lote(_lote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote carteira_lotes%ROWTYPE;
  v_count integer;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  SELECT * INTO v_lote FROM public.carteira_lotes WHERE id = _lote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lote não encontrado'; END IF;
  IF v_lote.status <> 'em_revisao' THEN RAISE EXCEPTION 'Só é possível excluir lotes em revisão'; END IF;

  -- Validar que há pelo menos 2 lotes na operação
  SELECT count(*) INTO v_count FROM public.carteira_lotes WHERE operacao_id = v_lote.operacao_id;
  IF v_count < 2 THEN RAISE EXCEPTION 'A operação precisa de pelo menos um lote'; END IF;

  -- Remover itens de seleção do lote
  DELETE FROM public.carteira_selecao_itens WHERE lote_id = _lote_id;

  -- Remover o lote
  DELETE FROM public.carteira_lotes WHERE id = _lote_id;

  -- Atualizar total_definido da operação
  UPDATE public.carteira_operacoes SET
    total_definido = (SELECT coalesce(sum(quantidade_definida), 0) FROM public.carteira_lotes WHERE operacao_id = v_lote.operacao_id),
    updated_at = now()
  WHERE id = v_lote.operacao_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.carteira_cancelar_lote(
  _lote_id uuid,
  _motivo text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote carteira_lotes%ROWTYPE;
  v_atrib record;
  v_encerradas integer := 0;
  v_todos_cancelados boolean;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;

  SELECT * INTO v_lote FROM public.carteira_lotes WHERE id = _lote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lote não encontrado'; END IF;
  IF v_lote.status <> 'ativo' THEN RAISE EXCEPTION 'Só é possível cancelar lotes ativos'; END IF;

  -- Encerrar todas as atribuições ativas do lote
  FOR v_atrib IN SELECT * FROM public.carteira_atribuicoes
                   WHERE lote_id = _lote_id AND encerrada_em IS NULL LOOP

    UPDATE public.carteira_atribuicoes SET
      encerrada_em = now(),
      status = 'cancelado',
      motivo_encerramento = _motivo,
      updated_at = now()
    WHERE id = v_atrib.id;

    -- Limpar responsável da conta
    UPDATE public.contas SET responsavel_id = NULL WHERE id = v_atrib.conta_id;

    -- Registrar evento na timeline
    INSERT INTO public.carteira_eventos (
      atribuicao_id, operacao_id, conta_id, lote_id, tipo,
      responsavel_anterior_id, gestor_id, status_anterior, status_novo,
      motivo, observacao, created_by
    ) VALUES (
      v_atrib.id, v_lote.operacao_id, v_atrib.conta_id, _lote_id, 'cancelamento_lote',
      v_atrib.corretor_id, auth.uid(), v_atrib.status, 'cancelado',
      _motivo, 'Lote cancelado pelo gestor. Conta devolvida para a carteira.', auth.uid()
    );

    v_encerradas := v_encerradas + 1;
  END LOOP;

  -- Marcar lote como cancelado
  UPDATE public.carteira_lotes SET status = 'cancelado', updated_at = now()
  WHERE id = _lote_id;

  -- Se todos os lotes da operação estão cancelados, cancelar a operação
  SELECT bool_and(status = 'cancelado') INTO v_todos_cancelados
    FROM public.carteira_lotes WHERE operacao_id = v_lote.operacao_id;
  IF v_todos_cancelados THEN
    UPDATE public.carteira_operacoes SET status = 'cancelada', updated_at = now()
    WHERE id = v_lote.operacao_id;
  END IF;

  RETURN jsonb_build_object('encerradas', v_encerradas);
END;
$$;

GRANT EXECUTE ON FUNCTION public.carteira_editar_lote(uuid, uuid, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_excluir_lote(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_cancelar_lote(uuid, text) TO authenticated;