DROP POLICY IF EXISTS "Subscribers can view own subscription" ON public.newsletter_subscribers;

CREATE POLICY "Admins and gestores can view newsletter subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));