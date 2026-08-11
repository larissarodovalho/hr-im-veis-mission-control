-- 1) Colunas de vínculo
ALTER TABLE public.visitas
  ADD COLUMN IF NOT EXISTS oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS oportunidade_visita_id uuid;
ALTER TABLE public.oportunidade_visitas
  ADD COLUMN IF NOT EXISTS visita_id uuid;
ALTER TABLE public.reunioes
  ADD COLUMN IF NOT EXISTS oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL;
ALTER TABLE public.ligacoes
  ADD COLUMN IF NOT EXISTS oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_visitas_oportunidade ON public.visitas(oportunidade_id);
CREATE INDEX IF NOT EXISTS idx_reunioes_oportunidade ON public.reunioes(oportunidade_id);
CREATE INDEX IF NOT EXISTS idx_ligacoes_oportunidade ON public.ligacoes(oportunidade_id);
CREATE INDEX IF NOT EXISTS idx_ov_visita ON public.oportunidade_visitas(visita_id);
CREATE INDEX IF NOT EXISTS idx_visitas_ov ON public.visitas(oportunidade_visita_id);

-- 2) Oportunidade aberta mais recente da conta
CREATE OR REPLACE FUNCTION public.oportunidade_ativa_da_conta(_conta_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id FROM public.oportunidades o
   WHERE _conta_id IS NOT NULL
     AND (o.conta_id = _conta_id OR (o.cliente_tipo = 'conta' AND o.cliente_id = _conta_id))
     AND coalesce(o.estagio,'') NOT IN ('ganha','perdida')
   ORDER BY o.created_at DESC
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.conta_da_oportunidade(_op_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(o.conta_id, CASE WHEN o.cliente_tipo = 'conta' THEN o.cliente_id END)
    FROM public.oportunidades o WHERE o.id = _op_id;
$$;

-- 3) Stamp automático dos dois vínculos
CREATE OR REPLACE FUNCTION public.stamp_conta_oportunidade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.oportunidade_id IS NULL AND NEW.conta_id IS NOT NULL THEN
    NEW.oportunidade_id := public.oportunidade_ativa_da_conta(NEW.conta_id);
  ELSIF NEW.conta_id IS NULL AND NEW.oportunidade_id IS NOT NULL THEN
    NEW.conta_id := public.conta_da_oportunidade(NEW.oportunidade_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_stamp_op_interacoes ON public.interacoes;
CREATE TRIGGER trg_stamp_op_interacoes BEFORE INSERT OR UPDATE OF conta_id, oportunidade_id ON public.interacoes
  FOR EACH ROW EXECUTE FUNCTION public.stamp_conta_oportunidade();

DROP TRIGGER IF EXISTS trg_stamp_op_tarefas ON public.tarefas;
CREATE TRIGGER trg_stamp_op_tarefas BEFORE INSERT OR UPDATE OF conta_id, oportunidade_id ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.stamp_conta_oportunidade();

DROP TRIGGER IF EXISTS trg_stamp_op_visitas ON public.visitas;
CREATE TRIGGER trg_stamp_op_visitas BEFORE INSERT OR UPDATE OF conta_id, oportunidade_id ON public.visitas
  FOR EACH ROW EXECUTE FUNCTION public.stamp_conta_oportunidade();

DROP TRIGGER IF EXISTS trg_stamp_op_reunioes ON public.reunioes;
CREATE TRIGGER trg_stamp_op_reunioes BEFORE INSERT OR UPDATE OF conta_id, oportunidade_id ON public.reunioes
  FOR EACH ROW EXECUTE FUNCTION public.stamp_conta_oportunidade();

DROP TRIGGER IF EXISTS trg_stamp_op_ligacoes ON public.ligacoes;
CREATE TRIGGER trg_stamp_op_ligacoes BEFORE INSERT OR UPDATE OF conta_id, oportunidade_id ON public.ligacoes
  FOR EACH ROW EXECUTE FUNCTION public.stamp_conta_oportunidade();

-- 4) Mapeamento de status entre os dois formatos
CREATE OR REPLACE FUNCTION public.visita_status_para_conta(_s text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE lower(coalesce(_s,'agendada'))
    WHEN 'agendada' THEN 'Agendada'
    WHEN 'confirmada' THEN 'Confirmada'
    WHEN 'realizada' THEN 'Realizada'
    WHEN 'cancelada' THEN 'Cancelada'
    WHEN 'reagendada' THEN 'Reagendada'
    WHEN 'nao_compareceu' THEN 'Não compareceu'
    ELSE initcap(coalesce(_s,'Agendada')) END;
$$;

CREATE OR REPLACE FUNCTION public.visita_status_para_oportunidade(_s text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE lower(coalesce(_s,'agendada'))
    WHEN 'agendada' THEN 'agendada'
    WHEN 'confirmada' THEN 'confirmada'
    WHEN 'realizada' THEN 'realizada'
    WHEN 'cancelada' THEN 'cancelada'
    WHEN 'reagendada' THEN 'reagendada'
    WHEN 'não compareceu' THEN 'nao_compareceu'
    WHEN 'nao compareceu' THEN 'nao_compareceu'
    WHEN 'nao_compareceu' THEN 'nao_compareceu'
    ELSE 'agendada' END;
$$;

-- 5) Espelhamento visitas <-> oportunidade_visitas
CREATE OR REPLACE FUNCTION public.sync_visita_conta_to_oportunidade()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.oportunidade_visita_id IS NOT NULL THEN
      DELETE FROM public.oportunidade_visitas WHERE id = OLD.oportunidade_visita_id;
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.oportunidade_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.oportunidade_visita_id IS NULL THEN
    INSERT INTO public.oportunidade_visitas (oportunidade_id, conta_id, imovel_id, data_visita, status,
                                             corretor_id, observacao, visita_id, created_by)
    VALUES (NEW.oportunidade_id, NEW.conta_id, NEW.imovel_id, NEW.data_visita,
            public.visita_status_para_oportunidade(NEW.status), NEW.corretor_id, NEW.observacoes,
            NEW.id, NEW.created_by)
    RETURNING id INTO v_id;
    UPDATE public.visitas SET oportunidade_visita_id = v_id WHERE id = NEW.id;
  ELSE
    UPDATE public.oportunidade_visitas SET
      oportunidade_id = NEW.oportunidade_id, conta_id = NEW.conta_id, imovel_id = NEW.imovel_id,
      data_visita = NEW.data_visita, status = public.visita_status_para_oportunidade(NEW.status),
      corretor_id = NEW.corretor_id, observacao = NEW.observacoes, updated_at = now()
    WHERE id = NEW.oportunidade_visita_id
      AND (data_visita IS DISTINCT FROM NEW.data_visita
        OR status IS DISTINCT FROM public.visita_status_para_oportunidade(NEW.status)
        OR imovel_id IS DISTINCT FROM NEW.imovel_id
        OR corretor_id IS DISTINCT FROM NEW.corretor_id
        OR observacao IS DISTINCT FROM NEW.observacoes);
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_visita_oportunidade_to_conta()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.visita_id IS NOT NULL THEN
      DELETE FROM public.visitas WHERE id = OLD.visita_id;
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.visita_id IS NULL THEN
    INSERT INTO public.visitas (conta_id, imovel_id, corretor_id, data_visita, status, observacoes,
                                oportunidade_id, oportunidade_visita_id, created_by)
    VALUES (coalesce(NEW.conta_id, public.conta_da_oportunidade(NEW.oportunidade_id)), NEW.imovel_id,
            NEW.corretor_id, NEW.data_visita, public.visita_status_para_conta(NEW.status), NEW.observacao,
            NEW.oportunidade_id, NEW.id, NEW.created_by)
    RETURNING id INTO v_id;
    UPDATE public.oportunidade_visitas SET visita_id = v_id WHERE id = NEW.id;
  ELSE
    UPDATE public.visitas SET
      conta_id = coalesce(NEW.conta_id, conta_id), imovel_id = NEW.imovel_id, corretor_id = NEW.corretor_id,
      data_visita = NEW.data_visita, status = public.visita_status_para_conta(NEW.status),
      observacoes = NEW.observacao, oportunidade_id = NEW.oportunidade_id, updated_at = now()
    WHERE id = NEW.visita_id
      AND (data_visita IS DISTINCT FROM NEW.data_visita
        OR status IS DISTINCT FROM public.visita_status_para_conta(NEW.status)
        OR imovel_id IS DISTINCT FROM NEW.imovel_id
        OR corretor_id IS DISTINCT FROM NEW.corretor_id
        OR observacoes IS DISTINCT FROM NEW.observacao);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_visita_conta ON public.visitas;
CREATE TRIGGER trg_sync_visita_conta AFTER INSERT OR UPDATE OR DELETE ON public.visitas
  FOR EACH ROW EXECUTE FUNCTION public.sync_visita_conta_to_oportunidade();

DROP TRIGGER IF EXISTS trg_sync_visita_op ON public.oportunidade_visitas;
CREATE TRIGGER trg_sync_visita_op AFTER INSERT OR UPDATE OR DELETE ON public.oportunidade_visitas
  FOR EACH ROW EXECUTE FUNCTION public.sync_visita_oportunidade_to_conta();

-- 6) Backfill: contas com exatamente uma oportunidade aberta
CREATE TEMP TABLE _uma_op ON COMMIT DROP AS
  SELECT coalesce(o.conta_id, CASE WHEN o.cliente_tipo='conta' THEN o.cliente_id END) AS conta_id,
         (array_agg(o.id))[1] AS op_id
    FROM public.oportunidades o
   WHERE coalesce(o.estagio,'') NOT IN ('ganha','perdida')
     AND coalesce(o.conta_id, CASE WHEN o.cliente_tipo='conta' THEN o.cliente_id END) IS NOT NULL
   GROUP BY 1
  HAVING count(*) = 1;

UPDATE public.interacoes i SET oportunidade_id = u.op_id
  FROM _uma_op u WHERE i.conta_id = u.conta_id AND i.oportunidade_id IS NULL;
UPDATE public.tarefas t SET oportunidade_id = u.op_id
  FROM _uma_op u WHERE t.conta_id = u.conta_id AND t.oportunidade_id IS NULL;
UPDATE public.reunioes r SET oportunidade_id = u.op_id
  FROM _uma_op u WHERE r.conta_id = u.conta_id AND r.oportunidade_id IS NULL;
UPDATE public.ligacoes l SET oportunidade_id = u.op_id
  FROM _uma_op u WHERE l.conta_id = u.conta_id AND l.oportunidade_id IS NULL;
UPDATE public.visitas v SET oportunidade_id = u.op_id
  FROM _uma_op u WHERE v.conta_id = u.conta_id AND v.oportunidade_id IS NULL;