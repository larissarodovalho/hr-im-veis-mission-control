
CREATE POLICY "Marketing sees all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'marketing'::app_role));

CREATE POLICY "Marketing sees all contas"
ON public.contas FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'marketing'::app_role));
