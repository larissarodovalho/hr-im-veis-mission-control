## Basear "Conversões" em Contas fechadas (Carteira + Marketing)

### Alteração em `src/pages/Reports.tsx`

1. **Trocar a fonte de dados de conversões**: em vez de contar leads com `etapa_funil = 'fechado'`, buscar `contas` (carteira e marketing juntas — a coluna `etapa_funil` é compartilhada) e contar por `responsavel_id` aquelas com `etapa_funil = 'fechado'`.
   - Adicionar `supabase.from("contas").select("responsavel_id, etapa_funil")` no `Promise.all`.
   - No agregador por corretor: `if (c.etapa_funil === "fechado") s.conversoes++` usando `c.responsavel_id`.
   - Remover o incremento atual em cima de `leads`.

2. **Manter "Leads" como está** (total de leads onde o corretor é `corretor_id`) e **Taxa = Conversões ÷ Leads × 100**.

3. **Atualizar o tooltip** do cabeçalho "Conversões":
   > "Contas do corretor cuja etapa do funil chegou a 'Fechado' (negócios ganhos, considerando Carteira e Marketing). Taxa = Conversões ÷ Leads × 100."

### Escopo
- Apenas `src/pages/Reports.tsx`. Sem mudanças de schema, RLS ou outros relatórios.
