## Mudança no gráfico "Evolução mensal"

No relatório de Faturamento, o gráfico hoje exibe as barras **empilhadas** (Vendedor + Captador + HR sobrepostas).

A solicitação é mostrar **colunas individuais lado a lado** para cada papel, por mês.

### Alteração
Em `src/components/reports/FaturamentoReport.tsx` (linhas 337-339), remover o `stackId="a"` das três barras para que o Recharts as renderize agrupadas (grouped bar chart) em vez de empilhadas:

```tsx
<Bar dataKey="Vendedor" fill="hsl(var(--primary))" />
<Bar dataKey="Captador" fill="hsl(var(--accent))" />
<Bar dataKey="HR" fill="hsl(var(--muted-foreground))" />
```

Resultado: para cada mês aparecem 3 barras separadas (Vendedor, Captador, HR), facilitando comparar os valores entre os papéis.

Nenhuma outra mudança — cálculos, KPIs, ranking, filtros e toggle VGV/Comissão continuam iguais.
