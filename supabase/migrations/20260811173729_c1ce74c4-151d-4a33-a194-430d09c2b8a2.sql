-- 1. Config table
CREATE TABLE public.carteira_config (
  id boolean PRIMARY KEY DEFAULT true,
  devolucao_automatica boolean NOT NULL DEFAULT true,
  dias_devolucao_automatica integer NOT NULL DEFAULT 7,
  dias_sem_proxima_acao integer NOT NULL DEFAULT 5,
  emails_resumo boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT carteira_config_singleton CHECK (id = true)
);

GRANT SELECT ON public.carteira_config TO authenticated;
GRANT UPDATE, INSERT ON public.carteira_config TO authenticated;
GRANT ALL ON public.carteira_config TO service_role;

ALTER TABLE public.carteira_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carteira_config_select" ON public.carteira_config
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "carteira_config_update" ON public.carteira_config
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "carteira_config_insert" ON public.carteira_config
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

INSERT INTO public.carteira_config (id) VALUES (true) ON CONFLICT DO NOTHING;

-- 2. Daily routine
CREATE OR REPLACE FUNCTION public.carteira_rotina_diaria()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cfg public.carteira_config%ROWTYPE;
  a record;
  v_atrasadas int := 0;
  v_devolvidas int := 0;
  v_sem_acao int := 0;
BEGIN
  SELECT * INTO cfg FROM public.carteira_config WHERE id = true;
  IF NOT FOUND THEN
    INSERT INTO public.carteira_config (id) VALUES (true);
    SELECT * INTO cfg FROM public.carteira_config WHERE id = true;
  END IF;

  -- 2.1 marcar atrasadas
  FOR a IN
    SELECT * FROM public.carteira_atribuicoes
     WHERE encerrada_em IS NULL
       AND tentativas = 0
       AND prazo_primeiro_contato IS NOT NULL
       AND prazo_primeiro_contato < now()
       AND status <> 'atrasada'
  LOOP
    UPDATE public.carteira_atribuicoes SET status = 'atrasada' WHERE id = a.id;
    INSERT INTO public.carteira_eventos (atribuicao_id, operacao_id, conta_id, lote_id, tipo,
      responsavel_novo_id, status_anterior, status_novo, observacao)
    VALUES (a.id, a.operacao_id, a.conta_id, a.lote_id, 'sla_atrasada',
      a.corretor_id, a.status, 'atrasada',
      'Prazo do primeiro contato vencido sem nenhuma tentativa registrada.');
    v_atrasadas := v_atrasadas + 1;
  END LOOP;

  -- 2.2 devolução automática por inatividade
  IF cfg.devolucao_automatica THEN
    FOR a IN
      SELECT * FROM public.carteira_atribuicoes
       WHERE encerrada_em IS NULL
         AND tentativas = 0
         AND contato_estabelecido_em IS NULL
         AND prazo_primeiro_contato IS NOT NULL
         AND prazo_primeiro_contato < now() - (cfg.dias_devolucao_automatica || ' days')::interval
    LOOP
      UPDATE public.carteira_atribuicoes SET
        encerrada_em = now(), status = 'devolvida',
        motivo_devolucao = 'Devolução automática por inatividade',
        motivo_encerramento = 'devolvida_automatica',
        solicitacao_tipo = NULL, solicitacao_motivo = NULL, solicitacao_em = NULL
      WHERE id = a.id;

      IF a.gestor_id IS NOT NULL THEN
        UPDATE public.contas SET responsavel_id = a.gestor_id WHERE id = a.conta_id;
      END IF;

      UPDATE public.tarefas SET status = 'Concluída'
       WHERE conta_id = a.conta_id AND responsavel_id = a.corretor_id AND status <> 'Concluída';

      INSERT INTO public.carteira_eventos (atribuicao_id, operacao_id, conta_id, lote_id, tipo,
        responsavel_anterior_id, gestor_id, status_novo, motivo, observacao)
      VALUES (a.id, a.operacao_id, a.conta_id, a.lote_id, 'devolucao_automatica',
        a.corretor_id, a.gestor_id, 'devolvida', 'Devolução automática por inatividade',
        'Sem tentativas de contato após ' || cfg.dias_devolucao_automatica || ' dias do prazo.');

      INSERT INTO public.interacoes (conta_id, atribuicao_id, tipo, descricao, resultado)
      VALUES (a.conta_id, a.id, 'nota',
        'Conta devolvida automaticamente à carteira da HR Imóveis por inatividade do corretor.',
        'carteira_devolucao_automatica');

      v_devolvidas := v_devolvidas + 1;
    END LOOP;
  END IF;

  -- 2.3 alerta: contato estabelecido sem próxima ação
  FOR a IN
    SELECT * FROM public.carteira_atribuicoes
     WHERE encerrada_em IS NULL
       AND contato_estabelecido_em IS NOT NULL
       AND (proxima_acao_em IS NULL OR proxima_acao_em < now())
       AND coalesce(ultima_atividade_em, atribuida_em) < now() - (cfg.dias_sem_proxima_acao || ' days')::interval
       AND NOT EXISTS (
         SELECT 1 FROM public.carteira_eventos e
          WHERE e.atribuicao_id = public.carteira_atribuicoes.id
            AND e.tipo = 'sla_sem_proxima_acao'
            AND e.created_at > now() - interval '7 days')
  LOOP
    INSERT INTO public.carteira_eventos (atribuicao_id, operacao_id, conta_id, lote_id, tipo,
      responsavel_novo_id, status_anterior, status_novo, observacao)
    VALUES (a.id, a.operacao_id, a.conta_id, a.lote_id, 'sla_sem_proxima_acao',
      a.corretor_id, a.status, a.status,
      'Contato estabelecido sem próxima ação agendada há mais de ' || cfg.dias_sem_proxima_acao || ' dias.');
    v_sem_acao := v_sem_acao + 1;
  END LOOP;

  RETURN jsonb_build_object('atrasadas', v_atrasadas, 'devolvidas', v_devolvidas, 'sem_proxima_acao', v_sem_acao);
END $function$;

REVOKE ALL ON FUNCTION public.carteira_rotina_diaria() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.carteira_rotina_diaria() TO service_role;

-- 3. Alertas do corretor
CREATE OR REPLACE FUNCTION public.carteira_alertas_corretor(_corretor uuid DEFAULT NULL)
RETURNS TABLE(atrasadas integer, acao_vencida integer, sem_proxima_acao integer, prazo_hoje integer, total_ativas integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH alvo AS (
    SELECT CASE WHEN public.is_admin() AND _corretor IS NOT NULL THEN _corretor ELSE auth.uid() END AS uid
  )
  SELECT
    count(*) FILTER (WHERE a.tentativas = 0 AND a.prazo_primeiro_contato < now())::int,
    count(*) FILTER (WHERE a.proxima_acao_em IS NOT NULL AND a.proxima_acao_em < now())::int,
    count(*) FILTER (WHERE a.contato_estabelecido_em IS NOT NULL AND a.proxima_acao_em IS NULL)::int,
    count(*) FILTER (WHERE a.tentativas = 0 AND a.prazo_primeiro_contato >= now()
                       AND (a.prazo_primeiro_contato AT TIME ZONE 'America/Cuiaba')::date
                           = (now() AT TIME ZONE 'America/Cuiaba')::date)::int,
    count(*)::int
  FROM public.carteira_atribuicoes a CROSS JOIN alvo
  WHERE a.encerrada_em IS NULL AND a.corretor_id = alvo.uid;
$function$;

REVOKE ALL ON FUNCTION public.carteira_alertas_corretor(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.carteira_alertas_corretor(uuid) TO authenticated, service_role;

-- 4. Alertas do gestor
CREATE OR REPLACE FUNCTION public.carteira_alertas_gestor()
RETURNS TABLE(corretor_id uuid, corretor_nome text, ativas integer, atrasadas integer, acao_vencida integer, solicitacoes integer, devolucoes_automaticas_7d integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT a.corretor_id,
         coalesce(p.nome, p.email, 'Corretor'),
         count(*) FILTER (WHERE a.encerrada_em IS NULL)::int,
         count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.tentativas = 0 AND a.prazo_primeiro_contato < now())::int,
         count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.proxima_acao_em IS NOT NULL AND a.proxima_acao_em < now())::int,
         count(*) FILTER (WHERE a.encerrada_em IS NULL AND a.solicitacao_tipo IS NOT NULL)::int,
         count(*) FILTER (WHERE a.motivo_encerramento = 'devolvida_automatica'
                            AND a.encerrada_em > now() - interval '7 days')::int
  FROM public.carteira_atribuicoes a
  LEFT JOIN public.profiles p ON p.user_id = a.corretor_id
  WHERE public.is_admin()
  GROUP BY a.corretor_id, coalesce(p.nome, p.email, 'Corretor')
  HAVING count(*) FILTER (WHERE a.encerrada_em IS NULL) > 0
      OR count(*) FILTER (WHERE a.motivo_encerramento = 'devolvida_automatica' AND a.encerrada_em > now() - interval '7 days') > 0
  ORDER BY 4 DESC, 3 DESC;
$function$;

REVOKE ALL ON FUNCTION public.carteira_alertas_gestor() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.carteira_alertas_gestor() TO authenticated, service_role;

-- 5. Devoluções automáticas recentes (para acompanhamento)
CREATE OR REPLACE FUNCTION public.carteira_devolucoes_automaticas(_dias integer DEFAULT 7)
RETURNS TABLE(conta_id uuid, conta_nome text, corretor_nome text, lote_nome text, devolvida_em timestamptz, observacao text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT e.conta_id, c.nome, coalesce(p.nome, p.email, 'Corretor'), l.nome, e.created_at, e.observacao
  FROM public.carteira_eventos e
  JOIN public.contas c ON c.id = e.conta_id
  LEFT JOIN public.profiles p ON p.user_id = e.responsavel_anterior_id
  LEFT JOIN public.carteira_lotes l ON l.id = e.lote_id
  WHERE public.is_admin()
    AND e.tipo = 'devolucao_automatica'
    AND e.created_at > now() - (coalesce(_dias, 7) || ' days')::interval
  ORDER BY e.created_at DESC;
$function$;

REVOKE ALL ON FUNCTION public.carteira_devolucoes_automaticas(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.carteira_devolucoes_automaticas(integer) TO authenticated, service_role;