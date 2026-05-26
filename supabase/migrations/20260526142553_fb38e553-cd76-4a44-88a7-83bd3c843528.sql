ALTER TABLE public.imoveis ADD COLUMN IF NOT EXISTS publicado boolean NOT NULL DEFAULT true;

CREATE OR REPLACE VIEW public.imoveis_public AS
SELECT id, codigo, titulo, descricao, tipo, finalidade, status, valor, valor_condominio, valor_iptu,
       quartos, suites, banheiros, vagas, area_total, area_util, area_construida,
       caracteristicas, fotos, destaque, endereco, numero, complemento, bairro, cidade, estado, cep,
       created_at, updated_at
FROM public.imoveis
WHERE status = 'Disponível' AND publicado = true;