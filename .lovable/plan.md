Adicionar mais KPIs no topo do Dashboard para dar uma visão geral do funil de leads, conforme solicitado.

**KPIs propostos** (substituem a faixa atual de 4 cartões):

1. **Total de leads** — todos os leads (mantido).
2. **Em atendimento / follow up** — leads cuja etapa esteja em: `Em Contato`, `Conversa Ativa`, `IA de acompanhamento`, `Manual de acompanhamento`, `Reunião Agendada`, `Visita`, `Proposta`.
3. **Novos sem contato** — etapa `Novo Lead`.
4. **Sem atendimento (3d+)** — mantido (>3 dias sem interação e não Fechado/Perdido).
5. **Fechados** — etapa `Fechado` (com cor de sucesso).
6. **Perdidos** — etapa `Perdido` (com cor de alerta).
7. **Taxa de conversão** — mantido (leads com reunião no mês ÷ total).
8. **Reuniões este mês** — mantido.

Layout: grid responsivo `grid-cols-2 md:grid-cols-4 lg:grid-cols-4` em duas linhas (8 KPIs total). O componente `KPI` já existente é reaproveitado, com suporte opcional a uma cor de destaque (`accent`/`success`/`danger`).

**Arquivo alterado:**
- `src/pages/Dashboard.tsx` — adicionar derivações `emAtendimento`, `novosSemContato`, `fechados`, `perdidos` e novos cards `<KPI>`; estender o componente `KPI` para aceitar variante `success`/`danger` no ícone.

**Sem mudanças em:** banco de dados, rotas, outros componentes.