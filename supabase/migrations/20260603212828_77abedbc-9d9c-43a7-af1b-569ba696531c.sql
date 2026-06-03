
-- Tighten user_roles: split ALL into explicit per-command policies; block all writes to non-admins
DROP POLICY IF EXISTS "Only admins manage roles" ON public.user_roles;

CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Restrict private originais bucket reads to admin/gestor/corretor (exclude secretaria/marketing)
DROP POLICY IF EXISTS "Staff read originais" ON storage.objects;

CREATE POLICY "Staff read originais" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'imoveis-originais'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'gestor'::app_role)
      OR public.has_role(auth.uid(), 'corretor'::app_role)
    )
  );
