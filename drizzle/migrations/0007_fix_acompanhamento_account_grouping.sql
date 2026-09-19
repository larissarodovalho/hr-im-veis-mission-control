DO $migration$
DECLARE
  function_definition text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
  INTO function_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'acompanhamento_corretores'
    AND pg_get_function_identity_arguments(p.oid) = '_inicio timestamp with time zone, _fim timestamp with time zone, _prazo_dias integer, _origens_carteira text[]';

  function_definition := replace(
    function_definition,
    'GROUP BY c.id,c.nome,c.responsavel_id,c.created_by,c.created_at,c.updated_at,c.etapa_funil,c.qualificacao_status,c.motivo_desclassificacao,c.lead_id_origem,c.categoria,c.origem_carteira,m.classificacao,m.observacao',
    'GROUP BY c.id,c.nome,c.tipo,c.documento,c.email,c.telefone,c.endereco,c.observacoes,c.tags,c.lead_id_origem,c.responsavel_id,c.created_by,c.created_at,c.updated_at,c.status,c.interesse,c.is_partner,c.etapa_funil,c.ramo_atividade,c.temperatura,c.parceiro_origem_id,c.desclassificada,c.motivo_desclassificacao,c.categoria,c.origem,c.data_entrada_carteira,c.destino_comercial,c.motivo_cancelamento,c.cancelado_em,c.cancelado_por,c.qualificacao_status,c.qualificacao_em,c.qualificacao_por,c.proxima_acao_em,c.origem_carteira,m.classificacao,m.observacao'
  );

  EXECUTE function_definition;
END;
$migration$;