## Objetivo

Adicionar um relatório em **Relatórios → Performance** que mostre quantos leads viraram contas ao longo do tempo, com taxa de conversão, para acompanhar o resultado do marketing.

## O que será construído

Um novo card/relatório (`LeadsParaContasReport`) acima do "Performance por corretor", contendo:

1. **KPIs no topo**
   - Leads criados no período
   - Contas criadas a partir de leads no período (contas com `lead_id_origem` preenchido)
   - Taxa de conversão (contas/leads × 100)

2. **Filtros de período**
   - Toggle entre dois modos:
     - **Mensal (últimos 12 meses)** — padrão
     - **Customizado** — dois date pickers (início/fim)

3. **Gráfico de linhas/barras (recharts)**
   - Eixo X: mês (modo mensal) ou dia agrupado (modo customizado; se range > 90 dias, agrupa por mês; senão, por dia)
   - Duas séries: **Leads criados** e **Contas geradas de leads**
   - Linha extra ou tooltip mostrando a **taxa de conversão (%)** no período

4. **Tabela resumo abaixo do gráfico**
   - Colunas: Período | Leads | Contas (origem lead) | Conversão %

## Lógica de dados

- **Leads** = `leads.created_at` dentro do período.
- **Contas geradas de lead** = `contas.created_at` dentro do período **com `lead_id_origem IS NOT NULL`**.
- Conversão = `contasComLead / leads × 100` (no mesmo bucket de tempo).
- Observação: a conta pode ter sido criada em mês diferente do lead. O relatório mostra ambos por data de criação do registro (não tenta casar lead↔conta cronologicamente — é a métrica padrão pedida).

## Arquivos

**Novo:** `src/components/reports/LeadsParaContasReport.tsx`
- Hooks: `useState` para modo/datas, `useEffect` para buscar dados.
- Queries no Supabase:
  - `supabase.from('leads').select('created_at').gte(...).lte(...)`
  - `supabase.from('contas').select('created_at,lead_id_origem').not('lead_id_origem','is',null).gte(...).lte(...)`
- Agrupamento em memória por mês (`YYYY-MM`) ou dia (`YYYY-MM-DD`).
- UI: `Card`, `Tabs`/`ToggleGroup` para modo, `Popover + Calendar` (shadcn datepicker com `pointer-events-auto`) para datas customizadas, `Recharts` (`LineChart` ou `BarChart`) e `Table` shadcn.

**Editado:** `src/pages/Reports.tsx`
- Importar `LeadsParaContasReport` e renderizar dentro de `<TabsContent value="performance">`, logo depois de `<FunilContasReport />`.

## Acesso

O componente já estará dentro da aba Relatórios, que hoje só admin/gestor acessa (`useRole`). Sem mudanças de permissão.

## Não inclui

- Quebra por origem do lead, por corretor, ou tempo médio lead→conta (não foram pedidos).
- Nenhuma mudança no banco — só leitura.