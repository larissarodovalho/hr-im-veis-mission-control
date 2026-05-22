## Aba "Faturamento" em Relatórios — VGV e comissão por responsável

Nova aba dentro de `/relatorios` que consolida vendas por papel (vendedor, captador, HR Imóveis), com filtros de período e gráfico de evolução.

### 1. Schema — split de comissão por papel
Hoje `vendas` tem só `valor_comissao` e `percentual_comissao` totais. Adicionar campos para dividir a comissão entre os três papéis:

- `percent_vendedor numeric` (default 40)
- `percent_captador numeric` (default 30)
- `percent_hr numeric` (default 30)

Regra: os três somam 100% da `valor_comissao` da venda. Edição direta no `NovaVendaDialog`/`EditarVendaDialog` (3 inputs com soma validada = 100). Valores em R$ são calculados em runtime (`valor_comissao * pct/100`).

### 2. Página — `src/components/reports/FaturamentoReport.tsx`
Plugar como nova `<TabsTrigger value="faturamento">` em `src/pages/Reports.tsx`.

**Filtros (topo)**:
- Período: presets *Mês atual*, *Últimos 3 meses*, *Ano atual*, *Customizado* (date-range). Filtra por `data_venda`.
- Papel: *Todos*, *Vendedor*, *Captador*, *HR Imóveis*.
- Corretor: SearchableSelect populado de `profiles` (limpável).

**KPIs (cards)**:
- VGV total no período (soma de `valor_venda`).
- Comissão total (soma de `valor_comissao`).
- Participação HR Imóveis (soma de `valor_comissao * percent_hr/100`).
- Nº de vendas no período.

**Ranking por corretor (tabela)**:
Colunas: Corretor • VGV vendedor • VGV captador • VGV total • Comissão vendedor • Comissão captador • Comissão total • Nº vendas. Ordenável por VGV total. Quando filtro "Papel" estiver ativo, mostra só as colunas relevantes. Linha final "HR Imóveis (casa)" agregando todas as participações da casa.

**Gráfico de evolução mensal**:
`recharts` (já no projeto). Barras empilhadas por mês × papel (vendedor/captador/HR) para VGV; toggle para alternar entre VGV e Comissão.

### 3. Sem mudanças em
- RLS de `vendas` (mantém regras atuais — admin/gestor vê tudo, corretor vê o que participa).
- Outros relatórios, Kanban de contas, ou páginas existentes.
- Migrations destrutivas — só `ALTER TABLE vendas ADD COLUMN` com defaults.

### Detalhes técnicos
- Hook novo `useVendasFaturamento(period, papel, corretorId)` agrega no client (volume de vendas é baixo). Se crescer, migrar para uma view materializada.
- Mapa de IDs → nome via `profiles` (já carregado em outras telas).
- Formatação BRL via `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.
- Export CSV/Excel da tabela de ranking reaproveitando padrão já usado em Accounts (xlsx + papaparse).