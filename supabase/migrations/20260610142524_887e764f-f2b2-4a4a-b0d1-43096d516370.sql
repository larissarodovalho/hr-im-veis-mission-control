CREATE OR REPLACE FUNCTION public.user_has_menu_override(_user_id uuid, _menu_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_menu_access
    WHERE user_id = _user_id AND menu_key = _menu_key AND allowed = true
  )
$$;

CREATE POLICY "Marketing com override ve todas contas"
ON public.contas FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'marketing'::app_role)
  AND public.user_has_menu_override(auth.uid(), 'contas')
);

CREATE POLICY "Marketing com override atualiza contas"
ON public.contas FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'marketing'::app_role)
  AND public.user_has_menu_override(auth.uid(), 'contas')
)
WITH CHECK (
  has_role(auth.uid(), 'marketing'::app_role)
  AND public.user_has_menu_override(auth.uid(), 'contas')
);