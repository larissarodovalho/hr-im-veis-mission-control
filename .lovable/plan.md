## Contexto
O relatório de Imóveis (`src/components/reports/ImoveisReport.tsx`) já cobre:
- Top captadores internos (qtd de imóveis captados por corretor) ✓
- Ticket médio vendido / valor médio por tipo ✓
- Distribuição por faixa de valor ✓

Faltam, segundo o pedido:
- Captação por **mês** e por **ano** (série temporal)
- Ranking de **bairros / condomínios** com mais imóveis cadastrados

## Mudanças

### 1. Nova seção "Captação por período"
Adicionar dois gráficos lado a lado dentro de um Card, abaixo do bloco de Captação existente:
- **Por mês** — agrupa `imoveisF` por `YYYY-MM` de `created_at`, ordenado cronologicamente (últimos 12 meses presentes).
- **Por ano** — agrupa por ano.

Ambos usam BarChart (recharts), seguindo o mesmo padrão visual dos gráficos atuais.

### 2. Nova seção "Bairros / Condomínios mais cadastrados"
Card com tabela (top 10), abaixo do bloco "Parceiros e captadores":
- Agrupar `imoveisF` por `bairro` (fallback "—" quando vazio).
- Adicional: agrupar por `complemento` quando contiver palavra "condomínio" / "cond." — para já dar visibilidade de condomínios. Caso seja muito ruidoso, listar apenas por bairro e deixar condomínio como melhoria futura.
- Colunas: Bairro | Cidade | Quantidade.

### 3. Export CSV
Estender `exportCsv` para incluir as novas seções: "Captação por mês", "Captação por ano", "Bairros".

## Detalhes técnicos
- Tudo no arquivo `src/components/reports/ImoveisReport.tsx`, sem novas dependências.
- Reaproveita `imoveisF` (já respeita filtros de período, cidade, finalidade).
- Sem mudanças de schema, RLS ou backend.
- Filtros atuais do relatório (De/Até/Cidade/Finalidade) continuam aplicados às novas seções automaticamente.

## Observação
Os filtros adicionados recentemente na tela de listagem de Imóveis (ano, mês, captador, faixa de valor, bairro) são da página `/crm/imoveis` e não precisam ser replicados como controles separados no relatório — o relatório já tem seus próprios filtros (período, cidade, finalidade) e os novos blocos vão expor essas mesmas dimensões como visualizações agregadas.