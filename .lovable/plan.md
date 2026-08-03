# Leads "sumidos" do funil — diagnóstico e melhoria de visibilidade

## Diagnóstico (confirmado no banco)

**Nenhum lead foi excluído.** Há 61 leads no banco, mas dois filtros da página Leads escondem a maioria da visão Kanban:

| Situação | Quantidade | Onde aparecem hoje |
|---|---|---|
| Etapas ativas do funil, não convertidos | **13** (8 Conversa Ativa, 5 Pré-atendimento, 0 Em Contato, 0 Novo Lead) | Kanban normalmente |
| Convertidos em Conta (`contas.lead_id_origem`) | **18** | Somem do funil por regra (viraram Conta) — ficam na aba Contas |
| Etapas legadas (Perdido 33, Permuta 5, Visita 2, Reunião 2, Proposta 1, Manual 1) | **44** (30 não convertidos) | **Não renderizam como coluna no Kanban** — só na visão Lista, filtro "Todas as etapas" ou "Somente legados" |

Ou seja: no Kanban o usuário vê só 13 cards de 61 leads. Os "sumidos" são principalmente os 33 "Perdido" (etapa legada que não vira coluna) e os 18 convertidos em Conta.

## Proposta

1. **Indicadores de leads ocultos no topo da página Leads** (`src/pages/Leads.tsx`):
   - Chip "X convertidos em Conta" → link para a aba Contas.
   - Chip "Y em etapas legadas (fora do Kanban)" → clica e alterna para visão Lista com filtro "Somente legados".
   - Assim fica sempre claro para onde os leads foram, sem sensação de perda.

2. **Contador por coluna no Kanban** já existe implicitamente; manter. O texto "13 de 61" no cabeçalho passa a ser explicado pelos chips acima.

3. Nada muda no banco de dados nem nas regras de conversão — apenas visibilidade/navegação.

## Detalhes técnicos

- Reusar `legacyCount` e `convertedIds` já calculados em `Leads.tsx` (linhas 61–93); adicionar `convertedCount = leads.filter(l => convertedIds.has(l.id)).length`.
- Chips renderizados ao lado do contador "{filtered.length} de {leads.length}" no header.
- Clique no chip de legados: `setView("list"); setListScope("legados")`.
- Clique no chip de convertidos: `navigate("/crm/contas")` (rota já existente).
- Alternativa avaliada e descartada: renderizar colunas legadas no Kanban — polui o funil novo; a visão Lista já atende.
