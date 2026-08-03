# Dashboard: deixar explícita a composição dos KPIs de leads

## Diagnóstico (confirmado no banco)

Os números estão corretos — o problema é que os cards parecem grupos separados, mas são conjuntos sobrepostos:

- **Total de leads: 61** = 43 no funil ativo + 18 convertidos em conta
- **Em atendimento: 43** = 9 em dia (contato ≤ 3 dias) + 34 sem atendimento
- **Sem atendimento (3d+): 34** é um recorte *dentro* dos 43 em atendimento, não um grupo à parte

Hoje nada no card mostra essa relação, então 43 + 34 parece estourar o total de 61.

## O que será feito

**`src/pages/Dashboard.tsx`** — adicionar suporte a um subtítulo (`hint`) no componente `KPI` (linha pequena em `text-muted-foreground` abaixo do valor) e preencher:

| KPI | Valor | Subtítulo |
|---|---|---|
| Total de leads | 61 | `43 no funil · 18 convertidos em conta` |
| Em atendimento | 43 | `9 em dia · 34 sem contato há 3+ dias` |
| Sem atendimento (3d+) | 34 | `dentro dos 43 em atendimento` |
| Convertidos em conta | 18 | `saíram do funil de leads` |

Os subtítulos são calculados dinamicamente (nada fixo) a partir dos mesmos filtros já usados nos KPIs.

## Validação

- Conferir no preview que os subtítulos aparecem e que a conta fecha: 9 + 34 = 43 e 43 + 18 = 61.
