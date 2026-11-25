CREATE OR REPLACE FUNCTION public.crm_user_is_active()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.ativo = true);
$$;
REVOKE ALL ON FUNCTION public.crm_user_is_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_user_is_active() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.crm_require_active_user()
RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() = 'authenticated' AND NOT public.crm_user_is_active() THEN
    RAISE SQLSTATE 'PT403' USING MESSAGE = 'Seu acesso ao CRM foi desativado. Entre em contato com um administrador.', DETAIL = 'USER_INACTIVE';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_require_active_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_require_active_user() TO anon, authenticated, service_role;
ALTER ROLE authenticator SET pgrst.db_pre_request = 'public.crm_require_active_user';
NOTIFY pgrst, 'reload config';

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relrowsecurity
  LOOP
    EXECUTE format('CREATE POLICY "Active users only" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.crm_user_is_active())) WITH CHECK ((SELECT public.crm_user_is_active()))', t.relname);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_profile_status_guard()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF (TG_OP = 'INSERT' AND NEW.ativo = false) OR (TG_OP = 'UPDATE' AND NEW.ativo IS DISTINCT FROM OLD.ativo) THEN
      RAISE SQLSTATE '42501' USING MESSAGE = 'O status de acesso só pode ser alterado pela ação administrativa de desativar ou reativar.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_profile_status_guard() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_profile_status_guard() TO service_role;
CREATE TRIGGER crm_profile_status_guard BEFORE INSERT OR UPDATE OF ativo ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.crm_profile_status_guard();

CREATE OR REPLACE FUNCTION public.crm_profile_status_doorbell()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.ativo IS DISTINCT FROM OLD.ativo THEN
    PERFORM realtime.send('{}'::jsonb, 'status_changed', 'auth:user:' || NEW.user_id::text, true);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_profile_status_doorbell() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_profile_status_doorbell() TO service_role;
CREATE TRIGGER crm_profile_status_doorbell AFTER UPDATE OF ativo ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.crm_profile_status_doorbell();

ALTER POLICY "Realtime broadcast scoped subscribe" ON realtime.messages TO authenticated
USING (extension = 'broadcast' AND (SELECT public.crm_user_is_active()) AND (
  topic = 'wa:user:' || auth.uid()::text
  OR (topic = 'wa:unassigned' AND public.is_staff())
  OR (topic = 'wa:staff:admin' AND public.is_admin())
  OR (topic NOT LIKE 'wa:%' AND topic NOT LIKE 'auth:%' AND public.is_staff())
));
ALTER POLICY "Realtime broadcast staff publish" ON realtime.messages TO authenticated
WITH CHECK (extension = 'broadcast' AND (SELECT public.crm_user_is_active()) AND public.is_staff());
CREATE POLICY "User receives own access-status doorbell" ON realtime.messages FOR SELECT TO authenticated
USING (extension = 'broadcast' AND topic = 'auth:user:' || auth.uid()::text);
