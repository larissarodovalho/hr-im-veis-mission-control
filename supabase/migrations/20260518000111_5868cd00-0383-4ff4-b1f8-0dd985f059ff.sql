ALTER TABLE public.imoveis REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.imoveis;