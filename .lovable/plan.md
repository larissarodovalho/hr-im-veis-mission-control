## Dashboard não mostra visita agendada

### Causa
O card de Visitas (e Ligações) no Dashboard usa a tabela `interacoes` filtrando por `tipo='visita'`/`'ligacao'`. Mas as visitas e ligações agendadas ficam nas tabelas dedicadas `visitas` (campo `data_visita`) e `ligacoes` (campo `data`) — mesma fonte usada pela aba Agenda. Por isso uma visita agendada não aparece.

### Mudanças em `src/pages/Dashboard.tsx`

1. **Carregar dados certos**
   - Substituir a query única em `interacoes` por duas queries:
     - `visitas`: `select id,status,data_visita` filtrando `data_visita` no mês atual.
     - `ligacoes`: `select id,resultado,data` filtrando `data` no mês atual.

2. **Card "Visitas (mês)"**
   - `visitsTotal` = quantidade de registros em `visitas` do mês.
   - `visitsTrend` agrupa por semana do mês usando `data_visita`.

3. **Card "Ligações (mês)"**
   - `callsTotal` = quantidade de registros em `ligacoes` do mês.
   - `callsByResult` agrupa por `resultado` (mantendo "outro" para nulos).

4. Remover o estado `interacoes` (não usado em mais nada na tela).

Sem mudanças de banco, RLS, ou outras telas.