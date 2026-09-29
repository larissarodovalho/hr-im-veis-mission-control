ALTER TABLE public.contas ADD COLUMN IF NOT EXISTS standby_ate timestamptz, ADD COLUMN IF NOT EXISTS standby_desde timestamptz, ADD COLUMN IF NOT EXISTS standby_motivo text, ADD COLUMN IF NOT EXISTS standby_por uuid;
ALTER TABLE public.oportunidades ADD COLUMN IF NOT EXISTS standby_ate timestamptz, ADD COLUMN IF NOT EXISTS standby_desde timestamptz, ADD COLUMN IF NOT EXISTS standby_motivo text, ADD COLUMN IF NOT EXISTS standby_por uuid;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS origem text;

CREATE OR REPLACE FUNCTION public.standby_encerrar_por_tarefa()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.origem = 'standby' AND NEW.status ILIKE 'conclu%' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NEW.conta_id IS NOT NULL THEN
      UPDATE public.contas SET standby_ate = NULL, standby_desde = NULL, standby_motivo = NULL, standby_por = NULL WHERE id = NEW.conta_id AND standby_ate IS NOT NULL;
    END IF;
    IF NEW.oportunidade_id IS NOT NULL THEN
      UPDATE public.oportunidades SET standby_ate = NULL, standby_desde = NULL, standby_motivo = NULL, standby_por = NULL WHERE id = NEW.oportunidade_id AND standby_ate IS NOT NULL;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_standby_tarefa ON public.tarefas;
CREATE TRIGGER trg_standby_tarefa AFTER UPDATE OF status ON public.tarefas FOR EACH ROW EXECUTE FUNCTION public.standby_encerrar_por_tarefa();

CREATE OR REPLACE FUNCTION public.standby_encerrar_por_interacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.conta_id IS NOT NULL THEN
    UPDATE public.contas SET standby_ate = NULL, standby_desde = NULL, standby_motivo = NULL, standby_por = NULL
      WHERE id = NEW.conta_id AND standby_ate IS NOT NULL AND standby_desde < NEW.created_at - interval '1 minute';
    UPDATE public.tarefas SET status = 'Concluída'
      WHERE conta_id = NEW.conta_id AND origem = 'standby' AND status NOT ILIKE 'conclu%' AND created_at < NEW.created_at - interval '1 minute';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_standby_interacao ON public.interacoes;
CREATE TRIGGER trg_standby_interacao AFTER INSERT ON public.interacoes FOR EACH ROW EXECUTE FUNCTION public.standby_encerrar_por_interacao();