## Ajustar Dashboard para mês atual

Atualmente o Dashboard mostra:
- **Reuniões**: card "Reuniões" usa todas as reuniões já cadastradas (sem filtro de data) no gráfico por status e no badge total.
- **Ligações**: filtra interações dos **últimos 30 dias corridos** (`since = hoje - 30 dias`).
- **Visitas**: gráfico em **4 semanas corridas** a partir de hoje, usando a mesma janela de 30 dias.

### Mudanças

1. **Reuniões (card + KPI)**
   - Filtrar `reunioes` por `agendada_para` dentro do **mês atual** (do dia 1 às 00:00 até o 1º do próximo mês).
   - Badge passa a mostrar o total do mês.
   - Gráfico por status considera apenas as reuniões do mês.
   - O KPI "Reuniões este mês" continua igual (já está correto).

2. **Ligações (card)**
   - Trocar janela de "últimos 30 dias" para **mês atual** (filtro por `created_at` em interações do tipo `ligacao`).
   - Label do card: "Ligações (mês)".
   - Badge e gráfico por resultado refletem só o mês.

3. **Visitas (card)**
   - Trocar janela de "4 semanas" para **mês atual** (filtro por `created_at` em interações do tipo `visita`).
   - Label do card: "Visitas (mês)".
   - Gráfico passa a mostrar **visitas por semana dentro do mês atual** (semanas 1..N do mês), em vez das últimas 4 semanas corridas.
   - Badge mostra total do mês.

4. **Query de interações**
   - Mudar o `.gte("created_at", since)` para usar o início do mês atual em vez de hoje-30, para evitar trazer dados fora do escopo.

### Arquivo afetado
- `src/pages/Dashboard.tsx` (única alteração; apenas lógica de filtro/agrupamento e labels).

Sem mudanças de banco de dados, RLS, ou outros componentes.