
CREATE OR REPLACE FUNCTION public.imovel_links_performance(
  _inicio timestamptz, _fim timestamptz, _corretor uuid DEFAULT NULL, _imovel text DEFAULT NULL,
  _conta uuid DEFAULT NULL, _oportunidade uuid DEFAULT NULL, _tipo text DEFAULT NULL,
  _status text DEFAULT NULL, _dispositivo text DEFAULT NULL, _resultado text DEFAULT NULL,
  _duracao text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _uid uuid := auth.uid();
  _full boolean;
  _res jsonb;
BEGIN
  IF _uid IS NULL THEN RETURN '{}'::jsonb; END IF;
  _full := public.has_role(_uid,'admin') OR public.has_role(_uid,'gestor') OR public.has_role(_uid,'marketing');
  IF NOT _full AND NOT public.has_role(_uid,'corretor') THEN RETURN '{}'::jsonb; END IF;

  WITH base AS (
    SELECT l.* FROM public.imovel_links_compartilhados l
    WHERE l.created_at >= _inicio AND l.created_at <= _fim
      AND (_full OR l.corretor_id = _uid)
      AND (_corretor IS NULL OR l.corretor_id = _corretor)
      AND (_conta IS NULL OR l.conta_id = _conta)
      AND (_oportunidade IS NULL OR l.oportunidade_id = _oportunidade)
      AND (_tipo IS NULL OR l.tipo = _tipo)
      AND (_duracao IS NULL OR
           (_duracao = '30' AND l.validade_minutos <= 30) OR
           (_duracao = '60' AND l.validade_minutos > 30 AND l.validade_minutos <= 60) OR
           (_duracao = '90' AND l.validade_minutos > 60 AND l.validade_minutos <= 90) OR
           (_duracao = '120' AND l.validade_minutos > 90 AND l.validade_minutos <= 120) OR
           (_duracao = 'personalizado' AND l.validade_minutos > 120))
      AND (_status IS NULL OR
           (_status = 'ativo' AND l.estado_operacional = 'ativo' AND (l.expira_em IS NULL OR l.expira_em > now())) OR
           (_status = 'expirado' AND l.expira_em IS NOT NULL AND l.expira_em <= now() AND l.estado_operacional NOT IN ('revogado','substituido')) OR
           (_status = 'revogado' AND l.estado_operacional = 'revogado') OR
           (_status = 'substituido' AND l.estado_operacional = 'substituido'))
      AND (_imovel IS NULL OR EXISTS (
            SELECT 1 FROM public.imovel_link_itens it JOIN public.imoveis i ON i.id = it.imovel_id
            WHERE it.link_id = l.id
              AND (i.titulo ILIKE '%'||_imovel||'%' OR COALESCE(i.codigo,'') ILIKE '%'||_imovel||'%')))
  ),
  ev AS (
    SELECT e.link_id, e.tipo_evento, e.dispositivo
    FROM public.imovel_link_eventos e JOIN base b ON b.id = e.link_id
    WHERE COALESCE((e.metadata->>'bot')::boolean, false) = false
      AND COALESCE((e.metadata->>'invalidado')::boolean, false) = false
  ),
  agg AS (
    SELECT b.id, b.corretor_id, b.tipo, b.validade_minutos, b.conta_id, b.oportunidade_id,
      b.created_at, b.compartilhado_em, b.primeiro_acesso_em, b.expira_em,
      b.total_acessos, b.visitantes_unicos,
      COUNT(*) FILTER (WHERE e.tipo_evento IN ('envio_whatsapp_iniciado','compartilhamento_nativo_interno','copiou_link')) AS ev_compart,
      COUNT(*) FILTER (WHERE e.tipo_evento = 'envio_confirmado') AS ev_confirmado,
      COUNT(*) FILTER (WHERE e.tipo_evento = 'clique_whatsapp') AS ev_whatsapp,
      COUNT(*) FILTER (WHERE e.tipo_evento = 'gostei') AS ev_gostei,
      COUNT(*) FILTER (WHERE e.tipo_evento = 'rejeitou') AS ev_rejeitou,
      COUNT(*) FILTER (WHERE e.tipo_evento = 'solicitou_informacoes') AS ev_info,
      COUNT(*) FILTER (WHERE e.tipo_evento = 'solicitou_visita') AS ev_visita,
      (SELECT e2.dispositivo FROM ev e2 WHERE e2.link_id = b.id AND e2.dispositivo IS NOT NULL LIMIT 1) AS dispositivo
    FROM base b LEFT JOIN ev e ON e.link_id = b.id
    GROUP BY b.id, b.corretor_id, b.tipo, b.validade_minutos, b.conta_id, b.oportunidade_id,
             b.created_at, b.compartilhado_em, b.primeiro_acesso_em, b.expira_em,
             b.total_acessos, b.visitantes_unicos
  ),
  f AS (
    SELECT * FROM agg a
    WHERE (_dispositivo IS NULL OR a.dispositivo = _dispositivo)
      AND (_resultado IS NULL OR
           (_resultado = 'gostei' AND a.ev_gostei > 0) OR
           (_resultado = 'rejeitou' AND a.ev_rejeitou > 0) OR
           (_resultado = 'informacoes' AND a.ev_info > 0) OR
           (_resultado = 'visita' AND a.ev_visita > 0) OR
           (_resultado = 'sem_retorno' AND a.ev_gostei = 0 AND a.ev_rejeitou = 0 AND a.ev_info = 0 AND a.ev_visita = 0))
  ),
  kpis AS (
    SELECT
      COUNT(*)::int AS gerados,
      COUNT(*) FILTER (WHERE compartilhado_em IS NOT NULL OR ev_compart > 0)::int AS compartilhados,
      COUNT(*) FILTER (WHERE ev_confirmado > 0)::int AS envios_confirmados,
      COUNT(*) FILTER (WHERE primeiro_acesso_em IS NOT NULL)::int AS abertos,
      COUNT(*) FILTER (WHERE primeiro_acesso_em IS NULL)::int AS nao_abertos,
      COUNT(*) FILTER (WHERE primeiro_acesso_em IS NULL AND expira_em IS NOT NULL AND expira_em <= now())::int AS expirados_sem_abertura,
      COUNT(*) FILTER (WHERE primeiro_acesso_em IS NOT NULL AND expira_em IS NOT NULL AND expira_em <= now())::int AS expirados_com_abertura,
      COALESCE(SUM(total_acessos),0)::int AS total_acessos,
      COALESCE(SUM(visitantes_unicos),0)::int AS visitantes_unicos,
      COALESCE(SUM(ev_whatsapp),0)::int AS cliques_whatsapp,
      COALESCE(SUM(ev_gostei),0)::int AS gostei,
      COALESCE(SUM(ev_rejeitou),0)::int AS rejeicoes,
      COALESCE(SUM(ev_info),0)::int AS solicitacoes_info,
      COALESCE(SUM(ev_visita),0)::int AS solicitacoes_visita,
      COUNT(DISTINCT oportunidade_id) FILTER (WHERE oportunidade_id IS NOT NULL)::int AS oportunidades,
      (SELECT COUNT(DISTINCT v.id) FROM public.vendas v
        WHERE v.conta_id IN (SELECT conta_id FROM f WHERE conta_id IS NOT NULL)
          AND v.data_venda >= _inicio::date)::int AS vendas,
      COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (primeiro_acesso_em - COALESCE(compartilhado_em, created_at))) / 60)
        FILTER (WHERE primeiro_acesso_em IS NOT NULL))::int, 0) AS tempo_medio_min
    FROM f
  ),
  por_corretor AS (
    SELECT COALESCE(p.nome,'Sem responsável') AS chave, COUNT(*)::int AS gerados,
      COUNT(*) FILTER (WHERE f.primeiro_acesso_em IS NOT NULL)::int AS abertos,
      COALESCE(SUM(f.ev_gostei),0)::int AS gostei, COALESCE(SUM(f.ev_visita),0)::int AS visitas
    FROM f LEFT JOIN public.profiles p ON p.user_id = f.corretor_id
    GROUP BY 1 ORDER BY 2 DESC LIMIT 50
  ),
  itens AS (
    SELECT f.id, f.primeiro_acesso_em, f.ev_gostei, f.ev_visita, i.titulo, i.codigo, i.bairro, i.tipo AS tipo_imovel
    FROM f JOIN public.imovel_link_itens it ON it.link_id = f.id JOIN public.imoveis i ON i.id = it.imovel_id
  ),
  por_imovel AS (
    SELECT COALESCE(codigo || ' — ','') || titulo AS chave, COUNT(*)::int AS gerados,
      COUNT(*) FILTER (WHERE primeiro_acesso_em IS NOT NULL)::int AS abertos,
      COALESCE(SUM(ev_gostei),0)::int AS gostei, COALESCE(SUM(ev_visita),0)::int AS visitas
    FROM itens GROUP BY 1 ORDER BY 2 DESC LIMIT 50
  ),
  por_bairro AS (
    SELECT COALESCE(NULLIF(bairro,''),'Sem bairro') AS chave, COUNT(*)::int AS gerados,
      COUNT(*) FILTER (WHERE primeiro_acesso_em IS NOT NULL)::int AS abertos,
      COALESCE(SUM(ev_gostei),0)::int AS gostei, COALESCE(SUM(ev_visita),0)::int AS visitas
    FROM itens GROUP BY 1 ORDER BY 2 DESC LIMIT 30
  ),
  por_tipo_imovel AS (
    SELECT COALESCE(NULLIF(tipo_imovel,''),'Sem tipo') AS chave, COUNT(*)::int AS gerados,
      COUNT(*) FILTER (WHERE primeiro_acesso_em IS NOT NULL)::int AS abertos,
      COALESCE(SUM(ev_gostei),0)::int AS gostei, COALESCE(SUM(ev_visita),0)::int AS visitas
    FROM itens GROUP BY 1 ORDER BY 2 DESC LIMIT 30
  ),
  por_dispositivo AS (
    SELECT COALESCE(dispositivo,'Desconhecido') AS chave, COUNT(*)::int AS gerados,
      COUNT(*) FILTER (WHERE primeiro_acesso_em IS NOT NULL)::int AS abertos,
      COALESCE(SUM(ev_gostei),0)::int AS gostei, COALESCE(SUM(ev_visita),0)::int AS visitas
    FROM f GROUP BY 1 ORDER BY 2 DESC
  ),
  por_duracao AS (
    SELECT CASE
        WHEN validade_minutos <= 30 THEN '30 min'
        WHEN validade_minutos <= 60 THEN '1 hora'
        WHEN validade_minutos <= 90 THEN '1h30'
        WHEN validade_minutos <= 120 THEN '2 horas'
        ELSE 'Personalizado' END AS chave,
      COUNT(*)::int AS gerados,
      COUNT(*) FILTER (WHERE primeiro_acesso_em IS NOT NULL)::int AS abertos,
      COALESCE(SUM(ev_gostei),0)::int AS gostei, COALESCE(SUM(ev_visita),0)::int AS visitas
    FROM f GROUP BY 1 ORDER BY 2 DESC
  ),
  por_periodo AS (
    SELECT to_char(created_at AT TIME ZONE 'America/Cuiaba', 'YYYY-MM') AS chave,
      COUNT(*)::int AS gerados,
      COUNT(*) FILTER (WHERE primeiro_acesso_em IS NOT NULL)::int AS abertos,
      COALESCE(SUM(ev_gostei),0)::int AS gostei, COALESCE(SUM(ev_visita),0)::int AS visitas
    FROM f GROUP BY 1 ORDER BY 1
  )
  SELECT jsonb_build_object(
    'escopo', CASE WHEN _full THEN 'completo' ELSE 'proprios' END,
    'kpis', (SELECT to_jsonb(k) || jsonb_build_object(
        'taxa_abertura', CASE WHEN k.gerados > 0 THEN ROUND(k.abertos::numeric * 100 / k.gerados, 1) ELSE 0 END,
        'taxa_interesse', CASE WHEN k.abertos > 0 THEN ROUND(k.gostei::numeric * 100 / k.abertos, 1) ELSE 0 END,
        'taxa_visita', CASE WHEN k.abertos > 0 THEN ROUND(k.solicitacoes_visita::numeric * 100 / k.abertos, 1) ELSE 0 END,
        'taxa_conversao', CASE WHEN k.gerados > 0 THEN ROUND(k.vendas::numeric * 100 / k.gerados, 1) ELSE 0 END
      ) FROM kpis k),
    'por_corretor', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM por_corretor x), '[]'::jsonb),
    'por_imovel', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM por_imovel x), '[]'::jsonb),
    'por_bairro', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM por_bairro x), '[]'::jsonb),
    'por_tipo_imovel', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM por_tipo_imovel x), '[]'::jsonb),
    'por_dispositivo', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM por_dispositivo x), '[]'::jsonb),
    'por_duracao', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM por_duracao x), '[]'::jsonb),
    'por_periodo', COALESCE((SELECT jsonb_agg(to_jsonb(x)) FROM por_periodo x), '[]'::jsonb)
  ) INTO _res;

  RETURN COALESCE(_res, '{}'::jsonb);
END; $$;
