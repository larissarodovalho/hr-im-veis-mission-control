## Exibir características no site público

As características marcadas no cadastro (piscina, churrasqueira, etc.) são salvas em `imoveis.caracteristicas`, mas não estão sendo renderizadas em nenhuma página pública.

### Mudanças

**`src/pages/site/ImovelDetalhePage.tsx`**
- Incluir `caracteristicas: row.caracteristicas ?? []` no `mapImovelFromDb`.
- Adicionar uma nova seção "Características" na página de detalhe, exibindo cada item como chip/badge (apenas quando o array tiver itens).

**`src/pages/site/ImoveisPage.tsx`**
- Nos cards da listagem, mostrar as primeiras 3 características como badges discretas abaixo das infos de quartos/área (com "+N" quando houver mais), apenas se houver itens.

### Fora de escopo
- Filtro por característica na busca pública.
- Ícones específicos por característica (todas usam o mesmo estilo de chip).

Confirma para eu implementar?