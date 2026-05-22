-- Permitir que marketing seja considerado staff (necessário para upload de fotos e INSERT em imoveis)
CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'gestor'::app_role)
      OR public.has_role(auth.uid(), 'corretor'::app_role)
      OR public.has_role(auth.uid(), 'marketing'::app_role);
$function$;

-- Atualizar policies de imoveis para incluir marketing
DROP POLICY IF EXISTS "Staff sees all imoveis" ON public.imoveis;
CREATE POLICY "Staff sees all imoveis" ON public.imoveis
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'corretor'::app_role)
    OR has_role(auth.uid(), 'marketing'::app_role)
  );

DROP POLICY IF EXISTS "Staff can create imoveis" ON public.imoveis;
CREATE POLICY "Staff can create imoveis" ON public.imoveis
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'gestor'::app_role)
      OR has_role(auth.uid(), 'corretor'::app_role)
      OR has_role(auth.uid(), 'marketing'::app_role)
    )
  );

DROP POLICY IF EXISTS "Owner or admin/gestor updates imoveis" ON public.imoveis;
CREATE POLICY "Owner or admin/gestor updates imoveis" ON public.imoveis
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'marketing'::app_role)
    OR corretor_id = auth.uid()
    OR created_by = auth.uid()
  );

-- Storage: permitir que staff (inclui marketing agora) faça upload no bucket 'imoveis'
DROP POLICY IF EXISTS "Staff upload imoveis bucket" ON storage.objects;
CREATE POLICY "Staff upload imoveis bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'imoveis' AND public.is_staff());

DROP POLICY IF EXISTS "Staff update imoveis bucket" ON storage.objects;
CREATE POLICY "Staff update imoveis bucket" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'imoveis' AND public.is_staff());

DROP POLICY IF EXISTS "Staff delete imoveis bucket" ON storage.objects;
CREATE POLICY "Staff delete imoveis bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'imoveis' AND public.is_staff());