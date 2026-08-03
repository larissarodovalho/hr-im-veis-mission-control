CREATE OR REPLACE FUNCTION public.unificar_lead_em_conta(p_lead_id uuid, p_conta_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead public.leads%ROWTYPE;
  v_conta public.contas%ROWTYPE;
  v_interacoes int := 0;
  v_tarefas int := 0;
  v_reunioes int := 0;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead não encontrado';
  END IF;

  SELECT * INTO v_conta FROM public.contas WHERE id = p_conta_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta não encontrada';
  END IF;

  -- Permissão: admin/gestor, corretor/criador do lead ou responsável/criador da conta
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR v_lead.corretor_id = auth.uid()
    OR v_lead.created_by = auth.uid()
    OR v_conta.responsavel_id = auth.uid()
    OR v_conta.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Sem permissão para unificar este lead a esta conta';
  END IF;

  -- Vincula o lead à conta (é o que o marca como "convertido em conta" no funil/Dashboard/relatórios).
  -- Se a conta já estiver vinculada a outro lead, mantém o vínculo original e marca o lead como convertido.
  IF v_conta.lead_id_origem IS NULL THEN
    UPDATE public.contas SET lead_id_origem = p_lead_id WHERE id = p_conta_id;
  ELSE
    UPDATE public.leads SET status = 'Convertido' WHERE id = p_lead_id;
  END IF;

  -- Transfere o histórico do lead para a conta
  UPDATE public.interacoes SET conta_id = p_conta_id
  WHERE lead_id = p_lead_id AND conta_id IS NULL;
  GET DIAGNOSTICS v_interacoes = ROW_COUNT;

  UPDATE public.tarefas SET conta_id = p_conta_id
  WHERE lead_id = p_lead_id AND conta_id IS NULL;
  GET DIAGNOSTICS v_tarefas = ROW_COUNT;

  UPDATE public.reunioes SET conta_id = p_conta_id
  WHERE lead_id = p_lead_id AND conta_id IS NULL;
  GET DIAGNOSTICS v_reunioes = ROW_COUNT;

  RETURN jsonb_build_object(
    'conta_id', p_conta_id,
    'interacoes_movidas', v_interacoes,
    'tarefas_movidas', v_tarefas,
    'reunioes_movidas', v_reunioes
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.unificar_lead_em_conta(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.unificar_lead_em_conta(uuid, uuid) TO authenticated;