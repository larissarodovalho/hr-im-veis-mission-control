ALTER TABLE public.imovel_links_compartilhados DROP CONSTRAINT IF EXISTS imovel_links_estado_chk;
ALTER TABLE public.imovel_links_compartilhados ADD CONSTRAINT imovel_links_estado_chk
  CHECK (estado_operacional = ANY (ARRAY['ativo'::text,'revogado'::text,'substituido'::text,'expirado'::text]));