DROP POLICY IF EXISTS "Staff insert activity" ON public.activity_log;

CREATE POLICY "Staff insert activity"
ON public.activity_log
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_staff()
  AND (user_id IS NULL OR user_id = auth.uid())
);