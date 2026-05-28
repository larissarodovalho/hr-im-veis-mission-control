## Captações na agenda com nome do cliente

Hoje o título da captação na agenda é só `Captação: <título do imóvel>` (ou apenas "Captação"). Vou ajustar para incluir o nome do cliente (conta) vinculado.

### Mudança em `src/pages/Schedule.tsx`
- No mapeamento `captacoesAgendadas` (linha ~292), montar o título assim:
  - Base: `Captação` + (se houver imóvel) ` – <titulo do imóvel>`
  - Sufixo com cliente: ` · <nome da conta>` quando `conta_id` existir
- Resultado: `Captação – Fazenda Boa Vista · João da Silva` ou `Captação · João da Silva` quando ainda não houver imóvel.
- O Google Calendar push já usa `titulo` da captação, então o nome do cliente também passa a sincronizar automaticamente nos próximos eventos criados/atualizados.

Nenhuma mudança de schema, RLS ou edge function — apenas o cálculo do título no front.