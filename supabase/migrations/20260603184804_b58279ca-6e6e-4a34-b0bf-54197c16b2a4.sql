
-- Revert view to invoker (avoid SECURITY DEFINER view linter ERROR)
ALTER VIEW public.imoveis_public SET (security_invoker = true);

-- Recreate an anon SELECT policy scoped to published+available listings
DROP POLICY IF EXISTS "Public can view available imoveis" ON public.imoveis;
CREATE POLICY "Public can view available imoveis"
ON public.imoveis FOR SELECT
TO anon
USING (status = 'Disponível' AND publicado = true);

-- Limit anon to safe columns only (column-level privilege)
REVOKE SELECT ON public.imoveis FROM anon;
GRANT SELECT (
  id, codigo, titulo, descricao, tipo, finalidade, status,
  valor, valor_condominio,
  quartos, suites, banheiros, vagas,
  area_total, area_util, area_construida,
  caracteristicas, fotos, destaque, publicado,
  endereco, numero, complemento, bairro, cidade, estado, cep,
  created_at, updated_at
) ON public.imoveis TO anon;

-- Authenticated still needs full row access (covered by staff policies)
GRANT SELECT ON public.imoveis TO authenticated;
