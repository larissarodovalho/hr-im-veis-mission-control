## Alteração no Dashboard

No `src/pages/Dashboard.tsx`, o card KPI hoje mostra **"Reuniões esta semana"** (próximos 7 dias a partir de hoje).

### Mudança
- Trocar o cálculo `reunioesWeek` por `reunioesMes`: contar reuniões cujo `agendada_para` cai dentro do **mês corrente** (do dia 1 até o último dia do mês).
- Atualizar o label do KPI para **"Reuniões este mês"**.
- Manter o mesmo ícone (`Calendar`) e posição no grid de KPIs.

Nenhuma outra seção do Dashboard é afetada.
