
CREATE OR REPLACE FUNCTION public.oportunidades_duplicadas()
RETURNS TABLE (
  grupo_id uuid,
  grupo_tipo text,
  cliente_nome text,
  oportunidade_id uuid,
  titulo text,
  estagio text,
  corretor_id uuid,
  valor_alvo numeric,
  created_at timestamptz,
  n_interacoes bigint,
  n_visitas bigint,
  n_propostas bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT o.*,
           COALESCE(o.conta_id, CASE WHEN o.cliente_tipo = 'conta' THEN o.cliente_id END,
                    o.lead_id_origem, CASE WHEN o.cliente_tipo = 'lead' THEN o.cliente_id END) AS gid,
           CASE WHEN COALESCE(o.conta_id, CASE WHEN o.cliente_tipo = 'conta' THEN o.cliente_id END) IS NOT NULL
                THEN 'conta' ELSE 'lead' END AS gtipo
    FROM public.oportunidades o
  ), grupos AS (
    SELECT gid FROM base WHERE gid IS NOT NULL GROUP BY gid HAVING count(*) > 1
  )
  SELECT b.gid,
         b.gtipo,
         COALESCE(c.nome, l.nome, 'Cliente não identificado'),
         b.id,
         b.titulo,
         b.estagio,
         b.corretor_id,
         b.valor_alvo,
         b.created_at,
         (SELECT count(*) FROM public.interacoes i WHERE i.oportunidade_id = b.id),
         (SELECT count(*) FROM public.oportunidade_visitas v WHERE v.oportunidade_id = b.id)
           + (SELECT count(*) FROM public.visitas v2 WHERE v2.oportunidade_id = b.id),
         (SELECT count(*) FROM public.oportunidade_propostas p WHERE p.oportunidade_id = b.id)
           + (SELECT count(*) FROM public.conta_propostas p2 WHERE p2.oportunidade_id = b.id)
  FROM base b
  JOIN grupos g ON g.gid = b.gid
  LEFT JOIN public.contas c ON c.id = b.gid
  LEFT JOIN public.leads l ON l.id = b.gid
  WHERE public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')
  ORDER BY b.gid, b.created_at;
$$;

GRANT EXECUTE ON FUNCTION public.oportunidades_duplicadas() TO authenticated;

CREATE OR REPLACE FUNCTION public.oportunidades_unificar(_principal uuid, _duplicada uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.oportunidades%ROWTYPE;
  d public.oportunidades%ROWTYPE;
  moved jsonb := '{}'::jsonb;
  n int;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestor')) THEN
    RAISE EXCEPTION 'Sem permissão para unificar oportunidades';
  END IF;
  IF _principal = _duplicada THEN
    RAISE EXCEPTION 'Selecione oportunidades diferentes';
  END IF;

  SELECT * INTO p FROM public.oportunidades WHERE id = _principal;
  SELECT * INTO d FROM public.oportunidades WHERE id = _duplicada;
  IF p.id IS NULL OR d.id IS NULL THEN
    RAISE EXCEPTION 'Oportunidade não encontrada';
  END IF;

  IF COALESCE(p.conta_id::text, p.cliente_id::text, p.lead_id_origem::text)
     IS DISTINCT FROM COALESCE(d.conta_id::text, d.cliente_id::text, d.lead_id_origem::text)
     AND COALESCE(p.conta_id, '00000000-0000-0000-0000-000000000000'::uuid)
         <> COALESCE(d.conta_id, '11111111-1111-1111-1111-111111111111'::uuid) THEN
    RAISE EXCEPTION 'As oportunidades pertencem a clientes diferentes';
  END IF;

  UPDATE public.interacoes SET oportunidade_id = _principal WHERE oportunidade_id = _duplicada;
  GET DIAGNOSTICS n = ROW_COUNT; moved := moved || jsonb_build_object('interacoes', n);
  UPDATE public.tarefas SET oportunidade_id = _principal WHERE oportunidade_id = _duplicada;
  GET DIAGNOSTICS n = ROW_COUNT; moved := moved || jsonb_build_object('tarefas', n);
  UPDATE public.visitas SET oportunidade_id = _principal WHERE oportunidade_id = _duplicada;
  GET DIAGNOSTICS n = ROW_COUNT; moved := moved || jsonb_build_object('visitas', n);
  UPDATE public.oportunidade_visitas SET oportunidade_id = _principal WHERE oportunidade_id = _duplicada;
  GET DIAGNOSTICS n = ROW_COUNT; moved := moved || jsonb_build_object('oportunidade_visitas', n);
  UPDATE public.reunioes SET oportunidade_id = _principal WHERE oportunidade_id = _duplicada;
  GET DIAGNOSTICS n = ROW_COUNT; moved := moved || jsonb_build_object('reunioes', n);
  UPDATE public.ligacoes SET oportunidade_id = _principal WHERE oportunidade_id = _duplicada;
  GET DIAGNOSTICS n = ROW_COUNT; moved := moved || jsonb_build_object('ligacoes', n);
  UPDATE public.conta_propostas SET oportunidade_id = _principal WHERE oportunidade_id = _duplicada;
  GET DIAGNOSTICS n = ROW_COUNT; moved := moved || jsonb_build_object('conta_propostas', n);
  UPDATE public.oportunidade_propostas SET oportunidade_id = _principal WHERE oportunidade_id = _duplicada;
  GET DIAGNOSTICS n = ROW_COUNT; moved := moved || jsonb_build_object('oportunidade_propostas', n);
  UPDATE public.oportunidade_imoveis SET oportunidade_id = _principal WHERE oportunidade_id = _duplicada;
  GET DIAGNOSTICS n = ROW_COUNT; moved := moved || jsonb_build_object('oportunidade_imoveis', n);
  UPDATE public.conta_fechamentos SET oportunidade_id = _principal WHERE oportunidade_id = _duplicada;
  GET DIAGNOSTICS n = ROW_COUNT; moved := moved || jsonb_build_object('conta_fechamentos', n);
  UPDATE public.carteira_atribuicoes SET oportunidade_id = _principal WHERE oportunidade_id = _duplicada;
  GET DIAGNOSTICS n = ROW_COUNT; moved := moved || jsonb_build_object('carteira_atribuicoes', n);

  UPDATE public.oportunidades SET
    conta_id = COALESCE(conta_id, d.conta_id),
    lead_id_origem = COALESCE(lead_id_origem, d.lead_id_origem),
    valor_alvo = COALESCE(valor_alvo, d.valor_alvo),
    tipo_imovel = COALESCE(tipo_imovel, d.tipo_imovel),
    cidade = COALESCE(cidade, d.cidade),
    bairro = COALESCE(bairro, d.bairro),
    origem = COALESCE(origem, d.origem),
    categoria_origem = COALESCE(categoria_origem, d.categoria_origem),
    forma_pagamento = COALESCE(forma_pagamento, d.forma_pagamento),
    prazo_pretendido = COALESCE(prazo_pretendido, d.prazo_pretendido),
    possui_permuta = COALESCE(possui_permuta, d.possui_permuta),
    imovel_permuta = COALESCE(imovel_permuta, d.imovel_permuta),
    valor_estimado_permuta = COALESCE(valor_estimado_permuta, d.valor_estimado_permuta),
    caracteristicas_indispensaveis = COALESCE(caracteristicas_indispensaveis, d.caracteristicas_indispensaveis),
    possibilidade_financiamento = COALESCE(possibilidade_financiamento, d.possibilidade_financiamento),
    descricao_busca = COALESCE(descricao_busca, d.descricao_busca),
    data_diagnostico = COALESCE(data_diagnostico, d.data_diagnostico),
    diagnostico_por = COALESCE(diagnostico_por, d.diagnostico_por),
    corretor_id = COALESCE(corretor_id, d.corretor_id),
    corretor_gerador_id = COALESCE(corretor_gerador_id, d.corretor_gerador_id),
    corretor_original_id = COALESCE(corretor_original_id, d.corretor_original_id),
    atribuicao_id = COALESCE(atribuicao_id, d.atribuicao_id),
    lote_id = COALESCE(lote_id, d.lote_id),
    operacao_id = COALESCE(operacao_id, d.operacao_id),
    observacoes = NULLIF(concat_ws(E'\n\n',
        NULLIF(observacoes, ''),
        CASE WHEN COALESCE(NULLIF(d.observacoes, ''), NULLIF(d.descricao_busca, '')) IS NOT NULL
          THEN '— Unificado de "' || COALESCE(d.titulo, 'oportunidade duplicada') || '" em ' ||
               to_char(now() AT TIME ZONE 'America/Cuiaba', 'DD/MM/YYYY HH24:MI') || E':\n' ||
               COALESCE(NULLIF(d.observacoes, ''), d.descricao_busca)
        END), ''),
    updated_at = now()
  WHERE id = _principal;

  IF COALESCE(p.conta_id, d.conta_id) IS NOT NULL OR COALESCE(p.lead_id_origem, d.lead_id_origem) IS NOT NULL THEN
    INSERT INTO public.interacoes (conta_id, lead_id, oportunidade_id, tipo, descricao, created_by)
    VALUES (
      COALESCE(p.conta_id, d.conta_id, CASE WHEN p.cliente_tipo = 'conta' THEN p.cliente_id END),
      COALESCE(p.lead_id_origem, d.lead_id_origem, CASE WHEN p.cliente_tipo = 'lead' THEN p.cliente_id END),
      _principal,
      'nota',
      'Oportunidade unificada: "' || COALESCE(d.titulo, '—') || '" (etapa ' || COALESCE(d.estagio, '—') ||
      ') foi mesclada nesta oportunidade. Histórico transferido: ' || moved::text,
      auth.uid()
    );
  END IF;

  DELETE FROM public.oportunidades WHERE id = _duplicada;

  RETURN jsonb_build_object('ok', true, 'principal', _principal, 'removida', _duplicada, 'transferido', moved);
END;
$$;

GRANT EXECUTE ON FUNCTION public.oportunidades_unificar(uuid, uuid) TO authenticated;
