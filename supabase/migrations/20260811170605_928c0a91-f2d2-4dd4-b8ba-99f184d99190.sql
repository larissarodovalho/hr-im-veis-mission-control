-- Contas elegíveis para distribuição, aplicando filtros do gestor
CREATE OR REPLACE FUNCTION public.carteira_elegiveis(_filtros jsonb DEFAULT '{}'::jsonb, _q text DEFAULT NULL)
RETURNS TABLE(id uuid, nome text, telefone text, email text, categoria text, etapa_funil text,
              origem text, interesse text, temperatura text, endereco text, tags text[],
              responsavel_id uuid, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH f AS (SELECT coalesce(_filtros, '{}'::jsonb) AS j, nullif(trim(coalesce(_q,'')),'') AS q)
  SELECT c.id, c.nome, c.telefone, c.email, c.categoria, c.etapa_funil, c.origem, c.interesse,
         c.temperatura, c.endereco, c.tags, c.responsavel_id, c.created_at
  FROM public.contas c CROSS JOIN f
  WHERE public.is_admin()
    AND c.status = 'ativo'
    AND c.desclassificada = false
    AND c.cancelado_em IS NULL
    AND c.etapa_funil <> 'contato_cancelado'
    AND (nullif(trim(coalesce(c.telefone,'')),'') IS NOT NULL OR nullif(trim(coalesce(c.email,'')),'') IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM public.carteira_atribuicoes a WHERE a.conta_id = c.id AND a.encerrada_em IS NULL)
    AND NOT EXISTS (SELECT 1 FROM public.carteira_selecao_itens s
                     JOIN public.carteira_operacoes o ON o.id = s.operacao_id
                    WHERE s.conta_id = c.id AND o.status IN ('rascunho','em_revisao'))
    AND (f.j->'categoria' IS NULL OR jsonb_array_length(f.j->'categoria') = 0
         OR coalesce(c.categoria,'') IN (SELECT jsonb_array_elements_text(f.j->'categoria')))
    AND (f.j->'etapa_funil' IS NULL OR jsonb_array_length(f.j->'etapa_funil') = 0
         OR c.etapa_funil IN (SELECT jsonb_array_elements_text(f.j->'etapa_funil')))
    AND (f.j->'origem' IS NULL OR jsonb_array_length(f.j->'origem') = 0
         OR coalesce(c.origem,'') IN (SELECT jsonb_array_elements_text(f.j->'origem')))
    AND (f.j->'temperatura' IS NULL OR jsonb_array_length(f.j->'temperatura') = 0
         OR coalesce(c.temperatura,'') IN (SELECT jsonb_array_elements_text(f.j->'temperatura')))
    AND (f.j->'tags' IS NULL OR jsonb_array_length(f.j->'tags') = 0
         OR coalesce(c.tags,'{}') && ARRAY(SELECT jsonb_array_elements_text(f.j->'tags')))
    AND (nullif(f.j->>'cidade','') IS NULL OR coalesce(c.endereco,'') ILIKE '%' || (f.j->>'cidade') || '%')
    AND (nullif(f.j->>'interesse','') IS NULL OR coalesce(c.interesse,'') ILIKE '%' || (f.j->>'interesse') || '%')
    AND (nullif(f.j->>'responsavel_id','') IS NULL
         OR (f.j->>'responsavel_id') = 'qualquer'
         OR ((f.j->>'responsavel_id') = 'sem' AND c.responsavel_id IS NULL)
         OR ((f.j->>'responsavel_id') <> 'sem' AND c.responsavel_id::text = (f.j->>'responsavel_id')))
    AND (coalesce((f.j->>'sem_oportunidade_ativa')::boolean, false) = false
         OR NOT EXISTS (SELECT 1 FROM public.oportunidades o2
                         WHERE o2.conta_id = c.id AND o2.estagio NOT IN ('ganha','perdida')))
    AND (nullif(f.j->>'sem_contato_dias','') IS NULL
         OR NOT EXISTS (SELECT 1 FROM public.interacoes i
                         WHERE i.conta_id = c.id
                           AND i.created_at > now() - ((f.j->>'sem_contato_dias')::int || ' days')::interval))
    AND (f.q IS NULL
         OR c.nome ILIKE '%' || f.q || '%'
         OR lower(coalesce(c.email,'')) LIKE '%' || lower(f.q) || '%'
         OR (public.normalize_br_phone(f.q) <> '' AND public.normalize_br_phone(c.telefone) = public.normalize_br_phone(f.q)));
$$;

-- Gera (ou regenera) a seleção automática de uma operação
CREATE OR REPLACE FUNCTION public.carteira_gerar_selecao(_operacao_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_op public.carteira_operacoes%ROWTYPE;
  v_lote record;
  v_total int := 0;
  v_disp int;
  v_inseridos int := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT * INTO v_op FROM public.carteira_operacoes WHERE id = _operacao_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Operação não encontrada'; END IF;
  IF v_op.status = 'confirmada' THEN RAISE EXCEPTION 'Operação já confirmada'; END IF;

  DELETE FROM public.carteira_selecao_itens WHERE operacao_id = _operacao_id;

  SELECT coalesce(sum(quantidade_definida),0) INTO v_total FROM public.carteira_lotes WHERE operacao_id = _operacao_id;
  SELECT count(*) INTO v_disp FROM public.carteira_elegiveis(v_op.filtros, NULL);

  CREATE TEMP TABLE _pool ON COMMIT DROP AS
    SELECT e.id, row_number() OVER (ORDER BY random()) AS rn
    FROM public.carteira_elegiveis(v_op.filtros, NULL) e;

  FOR v_lote IN SELECT * FROM public.carteira_lotes WHERE operacao_id = _operacao_id ORDER BY numero LOOP
    INSERT INTO public.carteira_selecao_itens (operacao_id, lote_id, conta_id, origem, created_by)
    SELECT _operacao_id, v_lote.id, p.id, 'automatica', auth.uid()
    FROM _pool p
    WHERE NOT EXISTS (SELECT 1 FROM public.carteira_selecao_itens s WHERE s.operacao_id = _operacao_id AND s.conta_id = p.id)
    ORDER BY p.rn
    LIMIT v_lote.quantidade_definida;
  END LOOP;

  SELECT count(*) INTO v_inseridos FROM public.carteira_selecao_itens WHERE operacao_id = _operacao_id;

  UPDATE public.carteira_operacoes
     SET total_definido = v_total, total_selecionado = v_inseridos,
         geracoes_automaticas = geracoes_automaticas + 1, status = 'em_revisao'
   WHERE id = _operacao_id;

  RETURN jsonb_build_object('elegiveis', v_disp, 'necessarias', v_total, 'selecionadas', v_inseridos,
                            'faltando', greatest(v_total - v_inseridos, 0));
END $$;

-- Adiciona contas a um lote (seleção manual / ajuste)
CREATE OR REPLACE FUNCTION public.carteira_selecao_adicionar(_lote_id uuid, _conta_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_op uuid; v_add int := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT operacao_id INTO v_op FROM public.carteira_lotes WHERE id = _lote_id;
  IF v_op IS NULL THEN RAISE EXCEPTION 'Lote não encontrado'; END IF;

  INSERT INTO public.carteira_selecao_itens (operacao_id, lote_id, conta_id, origem, created_by)
  SELECT v_op, _lote_id, e.id, 'manual', auth.uid()
  FROM public.carteira_elegiveis('{}'::jsonb, NULL) e
  WHERE e.id = ANY(_conta_ids)
  ON CONFLICT (operacao_id, conta_id) DO NOTHING;
  GET DIAGNOSTICS v_add = ROW_COUNT;

  UPDATE public.carteira_operacoes
     SET total_selecionado = (SELECT count(*) FROM public.carteira_selecao_itens WHERE operacao_id = v_op),
         ajustes_manuais = ajustes_manuais + 1, status = 'em_revisao'
   WHERE id = v_op;
  RETURN jsonb_build_object('adicionadas', v_add);
END $$;

-- Remove contas da seleção provisória
CREATE OR REPLACE FUNCTION public.carteira_selecao_remover(_operacao_id uuid, _conta_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_del int := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  DELETE FROM public.carteira_selecao_itens WHERE operacao_id = _operacao_id AND conta_id = ANY(_conta_ids);
  GET DIAGNOSTICS v_del = ROW_COUNT;
  UPDATE public.carteira_operacoes
     SET total_selecionado = (SELECT count(*) FROM public.carteira_selecao_itens WHERE operacao_id = _operacao_id),
         ajustes_manuais = ajustes_manuais + 1
   WHERE id = _operacao_id;
  RETURN jsonb_build_object('removidas', v_del);
END $$;

-- Move uma conta entre lotes da mesma operação
CREATE OR REPLACE FUNCTION public.carteira_selecao_mover(_operacao_id uuid, _conta_id uuid, _lote_destino uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.carteira_lotes WHERE id = _lote_destino AND operacao_id = _operacao_id) THEN
    RAISE EXCEPTION 'Lote de destino inválido';
  END IF;
  UPDATE public.carteira_selecao_itens SET lote_id = _lote_destino, origem = 'manual'
   WHERE operacao_id = _operacao_id AND conta_id = _conta_id;
  UPDATE public.carteira_operacoes SET ajustes_manuais = ajustes_manuais + 1 WHERE id = _operacao_id;
  RETURN jsonb_build_object('ok', true);
END $$;

-- Substitui uma conta do lote (por outra escolhida ou sorteada)
CREATE OR REPLACE FUNCTION public.carteira_selecao_substituir(_operacao_id uuid, _conta_id uuid, _nova_conta_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lote uuid; v_filtros jsonb; v_nova uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT lote_id INTO v_lote FROM public.carteira_selecao_itens WHERE operacao_id = _operacao_id AND conta_id = _conta_id;
  IF v_lote IS NULL THEN RAISE EXCEPTION 'Conta não está na seleção'; END IF;
  SELECT filtros INTO v_filtros FROM public.carteira_operacoes WHERE id = _operacao_id;

  DELETE FROM public.carteira_selecao_itens WHERE operacao_id = _operacao_id AND conta_id = _conta_id;

  IF _nova_conta_id IS NOT NULL THEN
    SELECT e.id INTO v_nova FROM public.carteira_elegiveis('{}'::jsonb, NULL) e WHERE e.id = _nova_conta_id;
  ELSE
    SELECT e.id INTO v_nova FROM public.carteira_elegiveis(v_filtros, NULL) e ORDER BY random() LIMIT 1;
  END IF;

  IF v_nova IS NULL THEN
    RAISE EXCEPTION 'Nenhuma conta elegível disponível para substituição';
  END IF;

  INSERT INTO public.carteira_selecao_itens (operacao_id, lote_id, conta_id, origem, created_by)
  VALUES (_operacao_id, v_lote, v_nova, 'substituicao', auth.uid());

  UPDATE public.carteira_operacoes SET ajustes_manuais = ajustes_manuais + 1 WHERE id = _operacao_id;
  RETURN jsonb_build_object('nova_conta_id', v_nova);
END $$;

-- Confirmação atômica da distribuição
CREATE OR REPLACE FUNCTION public.carteira_confirmar_distribuicao(_operacao_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

    FOR v_item IN SELECT s.conta_id, c.nome AS conta_nome
                    FROM public.carteira_selecao_itens s
                    JOIN public.contas c ON c.id = s.conta_id
                   WHERE s.lote_id = v_lote.id LOOP

      INSERT INTO public.carteira_atribuicoes (
        conta_id, lote_id, operacao_id, lote_origem_id, modo_selecao,
        corretor_original_id, corretor_id, gestor_id, prazo_primeiro_contato,
        status, created_by
      ) VALUES (
        v_item.conta_id, v_lote.id, _operacao_id, v_lote.id, v_lote.modo,
        v_lote.corretor_id, v_lote.corretor_id, v_op.gestor_id, v_prazo,
        'primeiro_contato_pendente', auth.uid()
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
END $$;

REVOKE EXECUTE ON FUNCTION public.carteira_elegiveis(jsonb, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.carteira_gerar_selecao(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.carteira_selecao_adicionar(uuid, uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.carteira_selecao_remover(uuid, uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.carteira_selecao_mover(uuid, uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.carteira_selecao_substituir(uuid, uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.carteira_confirmar_distribuicao(uuid) FROM anon;