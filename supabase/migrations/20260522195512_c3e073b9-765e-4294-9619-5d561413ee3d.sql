-- 1) Fix Security Definer View: keep imoveis_public as security_invoker
ALTER VIEW public.imoveis_public SET (security_invoker = on);

-- Add public SELECT policy on base imoveis so anon can read only available listings via the view
DROP POLICY IF EXISTS "Public can view available imoveis" ON public.imoveis;
CREATE POLICY "Public can view available imoveis"
ON public.imoveis
FOR SELECT
TO anon, authenticated
USING (status = 'Disponível');

-- 2) Restrict activity_log INSERT to staff only
DROP POLICY IF EXISTS "Authenticated insert activity" ON public.activity_log;
CREATE POLICY "Staff insert activity"
ON public.activity_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_staff());