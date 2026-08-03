# Dashboard: alinhar KPI "Perdidos" (e demais KPIs de etapa) com a aba Leads

## Causa confirmada (verificada no banco)

Os 7 leads com etapa "Perdido" **já foram convertidos em conta** (todos têm `lead_id_origem` em `contas`). A aba Leads esconde leads convertidos do kanban — eles aparecem apenas no chip "convertidos em conta" — por isso a coluna **Perdido fica vazia**, enquanto o Dashboard conta os 7.

O mesmo desalinhamento afeta outros KPIs do Dashboard que hoje incluem convertidos:

| KPI | Dashboard hoje | Aba Leads (kanban) |
|---|---|---|
| Perdidos | 7 | 0 |
| Em atendimento | 54 | 43 |
| Novos sem contato | inclui convertidos | exclui |
| Fechados | inclui convertidos | exclui |

Convertidos por etapa: 7 em Pré-atendimento, 2 em Conversa Ativa, 2 em Em Contato, 7 em Perdido (total 18, igual ao KPI "Convertidos em conta").

## O que será feito

1. **`src/pages/Dashboard.tsx`** — aplicar a mesma regra da aba Leads a todos os KPIs baseados em etapa: excluir leads convertidos em conta de **Perdidos**, **Em atendimento**, **Novos sem contato** e **Fechados** (o KPI "Sem atendimento (3d+)" já exclui). Convertidos continuam contados apenas no KPI "Convertidos em conta".
2. **Regra de conversão alinhada ao relatório** — ao montar `convertedIds`, ignorar contas `desclassificada = true`, para que um lead cuja conta foi desclassificada volte a contar nos KPIs do funil (mesma regra do `FunilLeadsReport`). Hoje não há contas desclassificadas, então nenhum número muda por isso — é só alinhamento futuro.

## Resultado esperado após o ajuste

- **Perdidos: 7 → 0** (igual à coluna Perdido do kanban)
- **Em atendimento: 54 → 43** (igual ao kanban)
- Nenhum dado é alterado no banco — apenas o cálculo dos KPIs.

## Validação

- Conferir no preview que os KPIs batem com as colunas do kanban da aba Leads.
