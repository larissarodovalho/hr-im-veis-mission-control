DROP POLICY IF EXISTS "Staff sees corretores_parceiros" ON public.corretores_parceiros;
CREATE POLICY "Admin/gestor select corretores_parceiros"
  ON public.corretores_parceiros
  FOR SELECT
  USING (public.is_admin());