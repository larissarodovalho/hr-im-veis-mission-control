
CREATE POLICY "Anon can create site form leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  created_by IS NULL
  AND corretor_id IS NULL
  AND origem = 'Formulário Site'
);

GRANT INSERT ON public.leads TO anon;
