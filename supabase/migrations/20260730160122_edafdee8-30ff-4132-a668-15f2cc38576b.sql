-- 1. Colunas de qualificação em contas
ALTER TABLE public.contas
  ADD COLUMN IF NOT EXISTS qualificacao_status text,
  ADD COLUMN IF NOT EXISTS qualificacao_em timestamptz,
  ADD COLUMN IF NOT EXISTS qualificacao_por uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS proxima_acao_em timestamptz;

ALTER TABLE public.contas
  DROP CONSTRAINT IF EXISTS contas_qualificacao_status_check;
ALTER TABLE public.contas
  ADD CONSTRAINT contas_qualificacao_status_check
  CHECK (qualificacao_status IS NULL OR qualificacao_status IN ('pendente','oportunidade_ativa','oportunidade_futura','nao_qualificado'));

-- 2. Idempotência + financiamento em oportunidades
ALTER TABLE public.oportunidades
  ADD COLUMN IF NOT EXISTS chave_idempotencia text,
  ADD COLUMN IF NOT EXISTS possibilidade_financiamento boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS oportunidades_chave_idempotencia_uidx
  ON public.oportunidades (chave_idempotencia)
  WHERE chave_idempotencia IS NOT NULL;

-- 3. RPC transacional e idempotente de criação de oportunidade pela qualificação
CREATE OR REPLACE FUNCTION public.criar_oportunidade_qualificada(p_conta_id uuid, p_payload jsonb, p_chave text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conta public.contas%ROWTYPE;
  v_op_id uuid;
  v_titulo text;
  v_corretor uuid;
  v_permuta boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Idempotência: mesma chave retorna a oportunidade já criada
  IF p_chave IS NOT NULL THEN
    SELECT id INTO v_op_id FROM public.oportunidades WHERE chave_idempotencia = p_chave;
    IF FOUND THEN
      RETURN jsonb_build_object('oportunidade_id', v_op_id, 'ja_existia', true);
    END IF;
  END IF;

  SELECT * INTO v_conta FROM public.contas WHERE id = p_conta_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta não encontrada';
  END IF;

  v_titulo := nullif(trim(coalesce(p_payload->>'titulo', '')), '');
  v_corretor := nullif(p_payload->>'corretor_id', '')::uuid;
  IF v_corretor IS NULL THEN v_corretor := v_conta.responsavel_id; END IF;
  v_permuta := coalesce((p_payload->>'possui_permuta')::boolean, false);

  -- Validação dos campos mínimos
  IF v_titulo IS NULL THEN RAISE EXCEPTION 'Título obrigatório'; END IF;
  IF nullif(trim(coalesce(p_payload->>'descricao_busca', '')), '') IS NULL THEN RAISE EXCEPTION 'Descrição da busca obrigatória'; END IF;
  IF nullif(trim(coalesce(p_payload->>'tipo_imovel', '')), '') IS NULL THEN RAISE EXCEPTION 'Tipo de imóvel obrigatório'; END IF;
  IF nullif(trim(coalesce(p_payload->>'cidade', '')), '') IS NULL AND nullif(trim(coalesce(p_payload->>'bairro', '')), '') IS NULL THEN RAISE EXCEPTION 'Cidade ou região obrigatória'; END IF;
  IF nullif(p_payload->>'valor_alvo', '') IS NULL OR (p_payload->>'valor_alvo') !~ '^[0-9]+(\.[0-9]+)?$' THEN RAISE EXCEPTION 'Valor-alvo obrigatório'; END IF;
  IF v_corretor IS NULL THEN RAISE EXCEPTION 'Corretor responsável obrigatório'; END IF;

  INSERT INTO public.oportunidades (
    cliente_tipo, cliente_id, conta_id, lead_id_origem, categoria_origem, origem,
    titulo, descricao_busca, tipo_imovel, cidade, bairro, valor_alvo, prioridade,
    corretor_id, forma_pagamento, prazo_pretendido, possui_permuta, imovel_permuta,
    valor_estimado_permuta, caracteristicas_indispensaveis, observacoes,
    possibilidade_financiamento, estagio, created_by, chave_idempotencia
  ) VALUES (
    'conta', v_conta.id, v_conta.id, v_conta.lead_id_origem,
    CASE WHEN v_conta.categoria IN ('carteira','marketing') THEN v_conta.categoria ELSE NULL END,
    v_conta.origem,
    v_titulo,
    trim(p_payload->>'descricao_busca'),
    trim(p_payload->>'tipo_imovel'),
    nullif(trim(coalesce(p_payload->>'cidade', '')), ''),
    nullif(trim(coalesce(p_payload->>'bairro', '')), ''),
    (p_payload->>'valor_alvo')::numeric,
    coalesce(nullif(p_payload->>'prioridade', ''), 'media'),
    v_corretor,
    nullif(trim(coalesce(p_payload->>'forma_pagamento', '')), ''),
    nullif(trim(coalesce(p_payload->>'prazo_pretendido', '')), ''),
    v_permuta,
    CASE WHEN v_permuta THEN nullif(trim(coalesce(p_payload->>'imovel_permuta', '')), '') END,
    CASE WHEN v_permuta AND nullif(p_payload->>'valor_estimado_permuta', '') IS NULL THEN NULL
         WHEN v_permuta THEN (p_payload->>'valor_estimado_permuta')::numeric END,
    nullif(trim(coalesce(p_payload->>'caracteristicas_indispensaveis', '')), ''),
    nullif(trim(coalesce(p_payload->>'observacoes', '')), ''),
    coalesce((p_payload->>'possibilidade_financiamento')::boolean, false),
    'nova', auth.uid(), p_chave
  )
  RETURNING id INTO v_op_id;

  UPDATE public.contas SET
    qualificacao_status = 'oportunidade_ativa',
    qualificacao_em = now(),
    qualificacao_por = auth.uid(),
    destino_comercial = 'comprar_oportunidade'
  WHERE id = v_conta.id;

  INSERT INTO public.interacoes (conta_id, tipo, descricao, resultado, created_by)
  VALUES (v_conta.id, 'nota',
    'Qualificação concluída: oportunidade "' || v_titulo || '" criada na etapa Nova do funil de Oportunidades de Negócio.',
    'qualificacao_oportunidade', auth.uid());

  INSERT INTO public.interacoes (conta_id, oportunidade_id, tipo, descricao, resultado, created_by)
  VALUES (v_conta.id, v_op_id, 'nota',
    'Oportunidade criada a partir da qualificação da conta "' || v_conta.nome || '" (origem: ' || coalesce(v_conta.categoria, 'sem categoria') || ').',
    'origem_oportunidade', auth.uid());

  RETURN jsonb_build_object('oportunidade_id', v_op_id, 'ja_existia', false);

EXCEPTION WHEN unique_violation THEN
  -- Concorrência: outra requisição com a mesma chave venceu a corrida
  SELECT id INTO v_op_id FROM public.oportunidades WHERE chave_idempotencia = p_chave;
  RETURN jsonb_build_object('oportunidade_id', v_op_id, 'ja_existia', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_oportunidade_qualificada(uuid, jsonb, text) TO authenticated;

-- 4. Backfill do status de qualificação das contas já em Contato estabelecido
UPDATE public.contas c SET qualificacao_status = 'oportunidade_ativa'
WHERE c.etapa_funil = 'contato_estabelecido'
  AND c.qualificacao_status IS NULL
  AND EXISTS (
    SELECT 1 FROM public.oportunidades o
    WHERE o.conta_id = c.id AND o.estagio IN ('nova','buscando','visita','proposta')
  );

UPDATE public.contas SET qualificacao_status = 'oportunidade_futura'
WHERE etapa_funil = 'contato_estabelecido'
  AND qualificacao_status IS NULL
  AND destino_comercial = 'oportunidade_futura';

UPDATE public.contas SET qualificacao_status = 'pendente'
WHERE etapa_funil = 'contato_estabelecido'
  AND qualificacao_status IS NULL;