# Subaba "Inativos / Não publicados" em Imóveis

## Objetivo
Criar uma subaba ao lado de "Disponíveis" com os imóveis inativos ou não publicados, e permitir marcar um imóvel como "Inativo" no cadastro/edição.

## Mudanças

### 1. Novo status "Inativo"
- Em `src/components/imoveis/NovoImovelDialog.tsx`, adicionar `"Inativo"` à lista `STATUS_OPTIONS` (usada também por `EditarImovelDialog.tsx`, então os dois formulários ganham a opção automaticamente).
- Sem migração de banco: `imoveis.status` é texto livre.

### 2. Nova subaba em `src/pages/Imoveis.tsx`
- Critério da lista: imóvel com `status` "Inativo" ou "Indisponível" **ou** `publicado = false`, respeitando os filtros da página (busca, data, captador, valor, bairro).
- Nova aba **"Inativos / Não publicados"** logo após "Disponíveis", com contador no selo e no resumo do cabeçalho.
- Cartão da lista: mesmo visual do cartão de disponível (foto, título, corretor, proprietário, valor), mas:
  - mostra o selo de status (Inativo/Indisponível) e o selo "Não publicado" quando for o caso;
  - em vez de "Iniciar proposta", mostra o botão de **publicar/ocultar** (olho) e o de **editar**, para reativar o imóvel rapidamente.

### 3. Disponíveis deixa de mostrar esses imóveis
- A lista de Disponíveis passa a excluir imóveis inativos/indisponíveis e não publicados (hoje eles aparecem misturados).
- As abas "Em Proposta", "Em Fechamento" e "Vendidos" não mudam: um imóvel com proposta ou vendido continua nelas mesmo se estiver não publicado.

## Detalhes técnicos
- A função `stage()` ganha o retorno `"inativo"` quando o status é Inativo/Indisponível; o filtro de `publicado` é aplicado na montagem das listas.
- Contadores: `counts` ganha `i` (inativos); o texto do cabeçalho inclui o novo número.
- Nenhuma regra de proposta, venda ou site muda: o site público já filtra por `status = 'Disponível'`.

## Validação
- Typecheck, testes e build.
- No preview: marcar um imóvel como Inativo e ocultar outro, conferindo que ambos aparecem na nova subaba e somem de Disponíveis.
