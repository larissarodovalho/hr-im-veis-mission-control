-- ============ Leitura: carteira do corretor ============
CREATE OR REPLACE FUNCTION public.carteira_minha_carteira(_corretor uuid DEFAULT NULL)
RETURNS TABLE(
  atribuicao_id uuid, conta_id uuid, conta_nome text, telefone text, email text,
  etapa_funil text, categoria text, origem text, interesse text,
  lote_id uuid, lote_nome text, lote_numero int, corretor_id uuid, gestor_id uuid,
  atribuida_em timestamptz, prazo_primeiro_contato timestamptz,
  primeira_atividade_em timestamptz, contato_estabelecido_em timestamptz,
  ultima_atividade_em timestamptz, tentativas int,
  proxima_acao text, proxima_acao_em timestamptz, status text,
  solicitacao_tipo text, solicitacao_motivo text, solicitacao_em timestamptz,
  encerrada_em timestamptz, motivo_encerramento text, tem_oportunidade boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.conta_id, c.nome, c.telefone, c.email,
         c.etapa_funil, c.categoria, c.origem, c.interesse,
         a.lote_id, l.nome, l.numero, a.corretor_id, a.gestor_id,
         a.atribuida_em, a.prazo_primeiro_contato,
         a.primeira_atividade_em, a.contato_estabelecido_em,
         a.ultima_atividade_em, a.tentativas,
         a.proxima_acao, a.proxima_acao_em, a.status,
         a.solicitacao_tipo, a.solicitacao_motivo, a.solicitacao_em,
         a.encerrada_em, a.motivo_encerramento,
         EXISTS (SELECT 1 FROM public.oportunidades o
                  WHERE o.conta_id = a.conta_id AND o.estagio NOT IN ('ganha','perdida'))
    FROM public.carteira_atribuicoes a
    JOIN public.contas c ON c.id = a.conta_id
    LEFT JOIN public.carteira_lotes l ON l.id = a.lote_id
   WHERE (
           (public.is_admin() AND (_corretor IS NULL OR a.corretor_id = _corretor))
           OR a.corretor_id = auth.uid()
         )
   ORDER BY a.encerrada_em NULLS FIRST, a.prazo_primeiro_contato NULLS LAST, a.atribuida_em DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.carteira_minha_carteira(uuid) FROM anon;

-- ============ Resumo dos lotes para o gestor ============
CREATE OR REPLACE FUNCTION public.carteira_resumo_lotes()
RETURNS TABLE(
  lote_id uuid, lote_nome text, numero int, corretor_id uuid, operacao_id uuid,
  criado_em timestamptz, total int, pendentes int, atrasadas int,
  em_atendimento int, contato_estabelecido int, com_oportunidade int,
  devolvidas int, transferidas int, solicitacoes int
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.nome, l.numero, l.corretor_id, l.operacao_id, l.created_at,
    count(a.*)::int,
    count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.status = 'primeiro_contato_pendente')::int,
    count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.contato_estabelecido_em IS NULL
                       AND a.prazo_primeiro_contato < now())::int,
    count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.status = 'em_atendimento')::int,
    count(*) FILTER (WHERE a.contato_estabelecido_em IS NOT NULL)::int,
    count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.oportunidades o
                                    WHERE o.conta_id = a.conta_id
                                      AND o.estagio NOT IN ('ganha','perdida')))::int,
    count(*) FILTER (WHERE a.status = 'devolvida')::int,
    count(*) FILTER (WHERE a.status = 'transferida')::int,
    count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.solicitacao_tipo IS NOT NULL)::int
  FROM public.carteira_lotes l
  LEFT JOIN public.carteira_atribuicoes a ON a.lote_id = l.id
  WHERE public.is_admin()
    AND EXISTS (SELECT 1 FROM public.carteira_operacoes op
                 WHERE op.id = l.operacao_id AND op.status = 'confirmada')
  GROUP BY l.id, l.nome, l.numero, l.corretor_id, l.operacao_id, l.created_at
  ORDER BY l.created_at DESC, l.numero;
$$;
REVOKE EXECUTE ON FUNCTION public.carteira_resumo_lotes() FROM anon;

-- ============ Helper interno ============
CREATE OR REPLACE FUNCTION public.carteira_atrib_permitida(_a public.carteira_atribuicoes)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin() OR _a.corretor_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.carteira_atrib_permitida(public.carteira_atribuicoes) FROM anon;

-- ============ Registrar tentativa de contato ============
CREATE OR REPLACE FUNCTION public.carteira_registrar_tentativa(
  _atribuicao_id uuid, _tipo text, _descricao text DEFAULT NULL, _resultado text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.carteira_atribuicoes%ROWTYPE; v_status text;
BEGIN
  SELECT * INTO a FROM public.carteira_atribuicoes WHERE id = _atribuicao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atribuição não encontrada'; END IF;
  IF NOT public.carteira_atrib_permitida(a) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF a.encerrada_em IS NOT NULL THEN RAISE EXCEPTION 'Esta conta não está mais na sua carteira'; END IF;
  IF _tipo NOT IN ('mensagem','audio','ligacao','visita','reuniao','email','nota') THEN
    RAISE EXCEPTION 'Tipo de contato inválido';
  END IF;

  v_status := CASE WHEN a.contato_estabelecido_em IS NOT NULL THEN a.status ELSE 'em_atendimento' END;

  UPDATE public.carteira_atribuicoes SET
    tentativas = tentativas + 1,
    primeira_atividade_em = coalesce(primeira_atividade_em, now()),
    ultima_atividade_em = now(),
    status = v_status
  WHERE id = _atribuicao_id;

  INSERT INTO public.interacoes (conta_id, atribuicao_id, tipo, descricao, resultado, created_by)
  VALUES (a.conta_id, a.id, _tipo,
          coalesce(nullif(trim(_descricao), ''), 'Tentativa de contato da carteira'),
          nullif(trim(coalesce(_resultado,'')), ''), auth.uid());

  INSERT INTO public.carteira_eventos (atribuicao_id, operacao_id, conta_id, lote_id, tipo,
    responsavel_novo_id, status_anterior, status_novo, observacao, created_by)
  VALUES (a.id, a.operacao_id, a.conta_id, a.lote_id, 'tentativa_contato',
          a.corretor_id, a.status, v_status,
          'Tentativa registrada (' || _tipo || ').', auth.uid());

  RETURN jsonb_build_object('ok', true, 'tentativas', a.tentativas + 1);
END $$;
REVOKE EXECUTE ON FUNCTION public.carteira_registrar_tentativa(uuid, text, text, text) FROM anon;

-- ============ Marcar contato estabelecido ============
CREATE OR REPLACE FUNCTION public.carteira_marcar_contato(
  _atribuicao_id uuid, _descricao text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.carteira_atribuicoes%ROWTYPE;
BEGIN
  SELECT * INTO a FROM public.carteira_atribuicoes WHERE id = _atribuicao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atribuição não encontrada'; END IF;
  IF NOT public.carteira_atrib_permitida(a) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF a.encerrada_em IS NOT NULL THEN RAISE EXCEPTION 'Esta conta não está mais na sua carteira'; END IF;

  UPDATE public.carteira_atribuicoes SET
    contato_estabelecido_em = coalesce(contato_estabelecido_em, now()),
    primeira_atividade_em = coalesce(primeira_atividade_em, now()),
    ultima_atividade_em = now(),
    status = 'contato_estabelecido'
  WHERE id = _atribuicao_id;

  UPDATE public.contas SET etapa_funil = 'contato_estabelecido'
   WHERE id = a.conta_id AND coalesce(etapa_funil,'a_contatar') IN ('a_contatar','contatado','sem_retorno');

  INSERT INTO public.interacoes (conta_id, atribuicao_id, tipo, descricao, resultado, created_by)
  VALUES (a.conta_id, a.id, 'nota',
          coalesce(nullif(trim(_descricao), ''), 'Contato estabelecido com o cliente da carteira.'),
          'contato_estabelecido', auth.uid());

  INSERT INTO public.carteira_eventos (atribuicao_id, operacao_id, conta_id, lote_id, tipo,
    responsavel_novo_id, status_anterior, status_novo, observacao, created_by)
  VALUES (a.id, a.operacao_id, a.conta_id, a.lote_id, 'contato_estabelecido',
          a.corretor_id, a.status, 'contato_estabelecido',
          nullif(trim(coalesce(_descricao,'')), ''), auth.uid());

  RETURN jsonb_build_object('ok', true);
END $$;
REVOKE EXECUTE ON FUNCTION public.carteira_marcar_contato(uuid, text) FROM anon;

-- ============ Agendar próxima ação ============
CREATE OR REPLACE FUNCTION public.carteira_agendar_proxima(
  _atribuicao_id uuid, _quando timestamptz, _titulo text DEFAULT NULL, _descricao text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.carteira_atribuicoes%ROWTYPE; v_titulo text; v_tarefa uuid;
BEGIN
  SELECT * INTO a FROM public.carteira_atribuicoes WHERE id = _atribuicao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atribuição não encontrada'; END IF;
  IF NOT public.carteira_atrib_permitida(a) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF a.encerrada_em IS NOT NULL THEN RAISE EXCEPTION 'Esta conta não está mais na sua carteira'; END IF;
  IF _quando IS NULL THEN RAISE EXCEPTION 'Informe a data e hora da próxima ação'; END IF;

  v_titulo := coalesce(nullif(trim(_titulo), ''), 'Retornar contato — carteira');

  INSERT INTO public.tarefas (titulo, descricao, responsavel_id, conta_id, prioridade, status, prazo, created_by)
  VALUES (v_titulo, nullif(trim(coalesce(_descricao,'')), ''), a.corretor_id, a.conta_id,
          'Alta', 'A fazer', _quando, auth.uid())
  RETURNING id INTO v_tarefa;

  UPDATE public.carteira_atribuicoes SET
    proxima_acao = v_titulo, proxima_acao_em = _quando, ultima_atividade_em = now()
  WHERE id = _atribuicao_id;

  INSERT INTO public.carteira_eventos (atribuicao_id, operacao_id, conta_id, lote_id, tipo,
    responsavel_novo_id, status_novo, observacao, metadata, created_by)
  VALUES (a.id, a.operacao_id, a.conta_id, a.lote_id, 'proxima_acao',
          a.corretor_id, a.status, v_titulo, jsonb_build_object('tarefa_id', v_tarefa, 'quando', _quando), auth.uid());

  RETURN jsonb_build_object('ok', true, 'tarefa_id', v_tarefa);
END $$;
REVOKE EXECUTE ON FUNCTION public.carteira_agendar_proxima(uuid, timestamptz, text, text) FROM anon;

-- ============ Corretor solicita devolução / transferência ============
CREATE OR REPLACE FUNCTION public.carteira_solicitar(
  _atribuicao_id uuid, _tipo text, _motivo text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.carteira_atribuicoes%ROWTYPE;
BEGIN
  SELECT * INTO a FROM public.carteira_atribuicoes WHERE id = _atribuicao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atribuição não encontrada'; END IF;
  IF NOT public.carteira_atrib_permitida(a) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF a.encerrada_em IS NOT NULL THEN RAISE EXCEPTION 'Esta conta não está mais na sua carteira'; END IF;
  IF _tipo NOT IN ('devolucao','transferencia') THEN RAISE EXCEPTION 'Tipo de solicitação inválido'; END IF;
  IF nullif(trim(coalesce(_motivo,'')), '') IS NULL THEN RAISE EXCEPTION 'Informe o motivo da solicitação'; END IF;

  UPDATE public.carteira_atribuicoes SET
    solicitacao_tipo = _tipo, solicitacao_motivo = trim(_motivo), solicitacao_em = now(),
    ultima_atividade_em = now()
  WHERE id = _atribuicao_id;

  INSERT INTO public.carteira_eventos (atribuicao_id, operacao_id, conta_id, lote_id, tipo,
    responsavel_anterior_id, status_novo, motivo, created_by)
  VALUES (a.id, a.operacao_id, a.conta_id, a.lote_id, 'solicitacao_' || _tipo,
          a.corretor_id, a.status, trim(_motivo), auth.uid());

  RETURN jsonb_build_object('ok', true);
END $$;
REVOKE EXECUTE ON FUNCTION public.carteira_solicitar(uuid, text, text) FROM anon;

-- ============ Gestor: transferir / devolver ============
CREATE OR REPLACE FUNCTION public.carteira_gestor_acao(
  _atribuicao_id uuid, _acao text, _novo_corretor uuid DEFAULT NULL, _motivo text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.carteira_atribuicoes%ROWTYPE; v_nova uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Apenas admin/gestor'; END IF;
  SELECT * INTO a FROM public.carteira_atribuicoes WHERE id = _atribuicao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atribuição não encontrada'; END IF;
  IF a.encerrada_em IS NOT NULL THEN RAISE EXCEPTION 'Atribuição já encerrada'; END IF;

  IF _acao = 'transferir' THEN
    IF _novo_corretor IS NULL THEN RAISE EXCEPTION 'Escolha o novo corretor'; END IF;
    IF _novo_corretor = a.corretor_id THEN RAISE EXCEPTION 'A conta já pertence a este corretor'; END IF;
    IF NOT public.has_role(_novo_corretor, 'corretor'::app_role) THEN
      RAISE EXCEPTION 'O destinatário não possui o perfil Corretor';
    END IF;

    UPDATE public.carteira_atribuicoes SET
      encerrada_em = now(), status = 'transferida',
      motivo_transferencia = nullif(trim(coalesce(_motivo,'')), ''),
      motivo_encerramento = 'transferida',
      solicitacao_tipo = NULL, solicitacao_motivo = NULL, solicitacao_em = NULL
    WHERE id = _atribuicao_id;

    INSERT INTO public.carteira_atribuicoes (
      conta_id, lote_id, operacao_id, lote_origem_id, modo_selecao,
      corretor_original_id, corretor_id, gestor_id, prazo_primeiro_contato,
      primeira_atividade_em, contato_estabelecido_em, ultima_atividade_em, tentativas,
      status, observacoes_internas, created_by
    ) VALUES (
      a.conta_id, a.lote_id, a.operacao_id, a.lote_origem_id, a.modo_selecao,
      a.corretor_original_id, _novo_corretor, auth.uid(),
      CASE WHEN a.contato_estabelecido_em IS NULL THEN now() + interval '3 days' ELSE a.prazo_primeiro_contato END,
      a.primeira_atividade_em, a.contato_estabelecido_em, now(), a.tentativas,
      CASE WHEN a.contato_estabelecido_em IS NOT NULL THEN 'contato_estabelecido' ELSE 'primeiro_contato_pendente' END,
      nullif(trim(coalesce(_motivo,'')), ''), auth.uid()
    ) RETURNING id INTO v_nova;

    UPDATE public.contas SET responsavel_id = _novo_corretor WHERE id = a.conta_id;

    INSERT INTO public.tarefas (titulo, descricao, responsavel_id, conta_id, prioridade, status, prazo, created_by)
    VALUES ('Primeiro contato — carteira (transferida)',
            'Conta transferida para você na distribuição de carteira.',
            _novo_corretor, a.conta_id, 'Alta', 'A fazer', now() + interval '3 days', auth.uid());

    INSERT INTO public.carteira_eventos (atribuicao_id, operacao_id, conta_id, lote_id, tipo,
      responsavel_anterior_id, responsavel_novo_id, gestor_id, motivo, created_by)
    VALUES (v_nova, a.operacao_id, a.conta_id, a.lote_id, 'transferencia',
            a.corretor_id, _novo_corretor, auth.uid(), nullif(trim(coalesce(_motivo,'')), ''), auth.uid());

    INSERT INTO public.interacoes (conta_id, atribuicao_id, tipo, descricao, resultado, created_by)
    VALUES (a.conta_id, v_nova, 'nota', 'Conta transferida na carteira para outro corretor.'
            || coalesce(' Motivo: ' || nullif(trim(coalesce(_motivo,'')), ''), ''), 'carteira_transferencia', auth.uid());

    RETURN jsonb_build_object('ok', true, 'atribuicao_id', v_nova);

  ELSIF _acao = 'devolver' THEN
    UPDATE public.carteira_atribuicoes SET
      encerrada_em = now(), status = 'devolvida',
      motivo_devolucao = nullif(trim(coalesce(_motivo,'')), ''),
      motivo_encerramento = 'devolvida',
      solicitacao_tipo = NULL, solicitacao_motivo = NULL, solicitacao_em = NULL
    WHERE id = _atribuicao_id;

    UPDATE public.contas SET responsavel_id = auth.uid() WHERE id = a.conta_id;

    UPDATE public.tarefas SET status = 'Concluída'
     WHERE conta_id = a.conta_id AND responsavel_id = a.corretor_id AND status <> 'Concluída';

    INSERT INTO public.carteira_eventos (atribuicao_id, operacao_id, conta_id, lote_id, tipo,
      responsavel_anterior_id, gestor_id, status_novo, motivo, created_by)
    VALUES (a.id, a.operacao_id, a.conta_id, a.lote_id, 'devolucao',
            a.corretor_id, auth.uid(), 'devolvida', nullif(trim(coalesce(_motivo,'')), ''), auth.uid());

    INSERT INTO public.interacoes (conta_id, atribuicao_id, tipo, descricao, resultado, created_by)
    VALUES (a.conta_id, a.id, 'nota', 'Conta devolvida para a carteira da HR Imóveis.'
            || coalesce(' Motivo: ' || nullif(trim(coalesce(_motivo,'')), ''), ''), 'carteira_devolucao', auth.uid());

    RETURN jsonb_build_object('ok', true);
  END IF;

  RAISE EXCEPTION 'Ação inválida';
END $$;
REVOKE EXECUTE ON FUNCTION public.carteira_gestor_acao(uuid, text, uuid, text) FROM anon;

-- ============ Gestor decide a solicitação ============
CREATE OR REPLACE FUNCTION public.carteira_resolver_solicitacao(
  _atribuicao_id uuid, _acao text, _novo_corretor uuid DEFAULT NULL, _observacao text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.carteira_atribuicoes%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Apenas admin/gestor'; END IF;
  SELECT * INTO a FROM public.carteira_atribuicoes WHERE id = _atribuicao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Atribuição não encontrada'; END IF;
  IF a.solicitacao_tipo IS NULL THEN RAISE EXCEPTION 'Não há solicitação pendente'; END IF;

  IF _acao = 'recusar' THEN
    UPDATE public.carteira_atribuicoes SET
      solicitacao_tipo = NULL, solicitacao_motivo = NULL, solicitacao_em = NULL
    WHERE id = _atribuicao_id;

    INSERT INTO public.carteira_eventos (atribuicao_id, operacao_id, conta_id, lote_id, tipo,
      responsavel_anterior_id, gestor_id, motivo, observacao, created_by)
    VALUES (a.id, a.operacao_id, a.conta_id, a.lote_id, 'solicitacao_recusada',
            a.corretor_id, auth.uid(), a.solicitacao_motivo,
            nullif(trim(coalesce(_observacao,'')), ''), auth.uid());

    RETURN jsonb_build_object('ok', true, 'resultado', 'recusada');
  ELSIF _acao = 'aprovar' THEN
    RETURN public.carteira_gestor_acao(
      _atribuicao_id,
      CASE WHEN a.solicitacao_tipo = 'transferencia' THEN 'transferir' ELSE 'devolver' END,
      _novo_corretor,
      coalesce(nullif(trim(coalesce(_observacao,'')), ''), a.solicitacao_motivo)
    );
  END IF;

  RAISE EXCEPTION 'Ação inválida';
END $$;
REVOKE EXECUTE ON FUNCTION public.carteira_resolver_solicitacao(uuid, text, uuid, text) FROM anon;