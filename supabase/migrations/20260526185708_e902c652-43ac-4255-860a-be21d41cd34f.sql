CREATE TABLE public.user_menu_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  menu_key text NOT NULL,
  allowed boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, menu_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_menu_access TO authenticated;
GRANT ALL ON public.user_menu_access TO service_role;

ALTER TABLE public.user_menu_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own menu access"
ON public.user_menu_access FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin/gestor reads all menu access"
ON public.user_menu_access FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admin/gestor inserts menu access"
ON public.user_menu_access FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin/gestor updates menu access"
ON public.user_menu_access FOR UPDATE TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin/gestor deletes menu access"
ON public.user_menu_access FOR DELETE TO authenticated
USING (is_admin());

CREATE TRIGGER user_menu_access_updated_at
BEFORE UPDATE ON public.user_menu_access
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_menu_access_user ON public.user_menu_access(user_id);