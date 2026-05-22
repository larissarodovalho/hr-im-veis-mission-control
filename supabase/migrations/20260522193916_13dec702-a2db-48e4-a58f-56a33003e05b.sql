
ALTER VIEW public.imoveis_public SET (security_invoker = off);
GRANT SELECT ON public.imoveis_public TO anon, authenticated;
