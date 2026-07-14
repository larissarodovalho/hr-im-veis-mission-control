## Objetivo
Na aba **Relatórios → Propostas**, adicionar duas novas visualizações (rankings) alimentadas pelas mesmas propostas já filtradas pelo período global:

1. **Imóveis que mais receberam propostas**
2. **Clientes que mais enviaram propostas**

## O que será adicionado (UI)

Em `src/components/reports/PropostasReport.tsx`, logo após os cards de KPI / gráficos existentes e antes da tabela "Propostas por corretor", duas novas cards lado a lado (grid 2 colunas no desktop, 1 no mobile):

### Card 1 — "Imóveis com mais propostas"
Tabela top 10 com colunas:
- Imóvel (código + título; linka para `/crm/imoveis/:id` quando houver id)
- Total de propostas
- Aceitas / Recusadas / Pendentes (badges compactos)
- Valor total proposto (soma dos `valor`)

Propostas sem `imovel_id` são agrupadas em uma linha "Sem imóvel vinculado" ao final (apenas se houver).

### Card 2 — "Clientes com mais propostas"
Tabela top 10 com colunas:
- Cliente (nome da conta; linka para `/crm/contas/:id`)
- Total de propostas
- Aceitas / Recusadas / Pendentes
- Valor total proposto
- Taxa de aceite (aceitas / total)

## Dados

Nenhuma alteração de schema nem nova query — os dados já estão em memória:
- `rows` já contém `imovel_id`, `imovel_codigo`, `imovel_titulo`, `conta_id`, `conta_nome`, `status`, `valor`.
- Os agregados serão calculados via `useMemo` em cima de `filtered` (mesmo array que alimenta os KPIs), garantindo que ambos os rankings respeitam o filtro global de período (ano/mês).

## Export

Estender os exports **CSV** e **Excel** existentes com duas abas/seções extras:
- CSV: manter o arquivo atual e gerar dois adicionais opcionais? → **Não.** Para simplicidade, adicionar dois botões separados "Exportar imóveis" e "Exportar clientes" ao lado do botão atual, gerando CSVs próprios.
- Excel: adicionar as abas `Top Imóveis` e `Top Clientes` no mesmo workbook já exportado.

## Arquivo tocado

- `src/components/reports/PropostasReport.tsx` — único arquivo alterado.

## Detalhes técnicos

- Ordenação padrão: por total de propostas desc; empate por valor total desc.
- Limite: top 10 em cada ranking, com "ver todos" removido (mantém curto). Se `filtered.length` for pequeno, exibe apenas as linhas existentes.
- Badges reutilizam `statusBadge` já definido no arquivo.
- Formatação monetária reutiliza `formatBRL`.
