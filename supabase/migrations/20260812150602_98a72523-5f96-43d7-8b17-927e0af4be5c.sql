ALTER TABLE public.carteira_atribuicoes
  ADD COLUMN IF NOT EXISTS responsavel_anterior_id uuid,
  ADD COLUMN IF NOT EXISTS categoria_anterior text,
  ADD COLUMN IF NOT EXISTS data_entrada_carteira_anterior timestamptz;

CREATE OR REPLACE FUNCTION public.carteira_confirmar_distribuicao(_operacao_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_op public.carteira_operacoes%ROWTYPE;
  v_lote record;
  v_item record;
  v_conflitos uuid[];
  v_atrib uuid;
  v_prazo timestamptz;
  v_corretor_nome text;
  v_total int := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT * INTO v_op FROM public.carteira_operacoes WHERE id = _operacao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Operação não encontrada'; END IF;
  IF v_op.status = 'confirmada' THEN RAISE EXCEPTION 'Operação já confirmada'; END IF;

  IF EXISTS (SELECT 1 FROM public.carteira_lotes l
              WHERE l.operacao_id = _operacao_id
                AND NOT public.has_role(l.corretor_id, 'corretor'::app_role)) THEN
    RAISE EXCEPTION 'Um dos destinatários não possui mais o perfil Corretor';
  END IF;

  IF (SELECT count(DISTINCT corretor_id) FROM public.carteira_lotes WHERE operacao_id = _operacao_id)
     <> (SELECT count(*) FROM public.carteira_lotes WHERE operacao_id = _operacao_id) THEN
    RAISE EXCEPTION 'Cada corretor deve ter apenas um lote nesta distribuição';
  END IF;

  SELECT array_agg(s.conta_id) INTO v_conflitos
    FROM public.carteira_selecao_itens s
   WHERE s.operacao_id = _operacao_id
     AND EXISTS (SELECT 1 FROM public.carteira_atribuicoes a WHERE a.conta_id = s.conta_id AND a.encerrada_em IS NULL);

  IF v_conflitos IS NOT NULL AND array_length(v_conflitos,1) > 0 THEN
    UPDATE public.carteira_operacoes SET status = 'em_revisao' WHERE id = _operacao_id;
    RAISE EXCEPTION 'Contas com atribuição ativa detectadas: %', array_length(v_conflitos,1);
  END IF;

  FOR v_lote IN SELECT * FROM public.carteira_lotes WHERE operacao_id = _operacao_id ORDER BY numero LOOP
    v_prazo := now() + (v_lote.prazo_primeiro_contato_dias || ' days')::interval;
    SELECT coalesce(p.nome, p.email, 'Corretor') INTO v_corretor_nome FROM public.profiles p WHERE p.user_id = v_lote.corretor_id;

    FOR v_item IN SELECT s.conta_id, c.nome AS conta_nome,
                         c.responsavel_id AS resp_ant, c.categoria AS cat_ant,
                         c.data_entrada_carteira AS dec_ant
                    FROM public.carteira_selecao_itens s
                    JOIN public.contas c ON c.id = s.conta_id
                   WHERE s.lote_id = v_lote.id LOOP

      INSERT INTO public.carteira_atribuicoes (
        conta_id, lote_id, operacao_id, lote_origem_id, modo_selecao,
        corretor_original_id, corretor_id, gestor_id, prazo_primeiro_contato,
        status, created_by,
        responsavel_anterior_id, categoria_anterior, data_entrada_carteira_anterior
      ) VALUES (
        v_item.conta_id, v_lote.id, _operacao_id, v_lote.id, v_lote.modo,
        v_lote.corretor_id, v_lote.corretor_id, v_op.gestor_id, v_prazo,
        'primeiro_contato_pendente', auth.uid(),
        v_item.resp_ant, v_item.cat_ant, v_item.dec_ant
      ) RETURNING id INTO v_atrib;

      UPDATE public.contas
         SET responsavel_id = v_lote.corretor_id,
             categoria = coalesce(categoria, 'carteira'),
             data_entrada_carteira = coalesce(data_entrada_carteira, now())
       WHERE id = v_item.conta_id;

      INSERT INTO public.tarefas (titulo, descricao, responsavel_id, conta_id, prioridade, status, prazo, created_by)
      VALUES ('Primeiro contato — carteira',
              'Conta recebida na distribuição de carteira (' || v_lote.nome || ').',
              v_lote.corretor_id, v_item.conta_id, 'Alta', 'A fazer', v_prazo, auth.uid());

      INSERT INTO public.carteira_eventos (atribuicao_id, operacao_id, conta_id, lote_id, lote_novo_id, tipo,
        responsavel_novo_id, gestor_id, status_novo, observacao, created_by)
      VALUES (v_atrib, _operacao_id, v_item.conta_id, v_lote.id, v_lote.id, 'atribuicao',
              v_lote.corretor_id, v_op.gestor_id, 'primeiro_contato_pendente',
              'Conta atribuída em ' || v_lote.nome || ' (modo: ' || v_lote.modo || ').', auth.uid());

      INSERT INTO public.interacoes (conta_id, atribuicao_id, tipo, descricao, resultado, created_by)
      VALUES (v_item.conta_id, v_atrib, 'nota',
              'Distribuição de carteira: conta atribuída a ' || v_corretor_nome || ' no lote "' || v_lote.nome || '". Prazo do primeiro contato: ' || to_char(v_prazo, 'DD/MM/YYYY') || '.',
              'carteira_atribuicao', auth.uid());

      v_total := v_total + 1;
    END LOOP;

    UPDATE public.carteira_lotes
       SET status = 'ativo',
           quantidade_inicial = (SELECT count(*) FROM public.carteira_selecao_itens WHERE lote_id = v_lote.id)
     WHERE id = v_lote.id;
  END LOOP;

  DELETE FROM public.carteira_selecao_itens WHERE operacao_id = _operacao_id;

  UPDATE public.carteira_operacoes
     SET status = 'confirmada', confirmada_em = now(), total_selecionado = v_total
   WHERE id = _operacao_id;

  RETURN jsonb_build_object('atribuicoes', v_total);
END $function$;

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

    -- Responsável original: salvo na atribuição; fallback = quem cadastrou a conta
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

    -- Cancelar tarefa automática de primeiro contato ainda pendente
    UPDATE public.tarefas
       SET status = 'Cancelada'
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
REVOKE ALL ON FUNCTION public.carteira_confirmar_distribuicao(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.carteira_cancelar_lote(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carteira_confirmar_distribuicao(uuid) TO authenticated;