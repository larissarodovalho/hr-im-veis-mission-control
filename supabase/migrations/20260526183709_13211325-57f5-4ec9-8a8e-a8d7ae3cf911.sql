CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'gestor'::app_role)
      OR public.has_role(auth.uid(), 'corretor'::app_role)
      OR public.has_role(auth.uid(), 'marketing'::app_role)
      OR public.has_role(auth.uid(), 'secretaria'::app_role);
$$;