## Objetivo
Quando um lead for convertido em conta, a conta deve aparecer automaticamente na subaba **Marketing** do funil de Contas — já que todos os leads vêm do marketing.

## Como a subaba funciona hoje
As subabas *Carteira* / *Marketing* do funil de Contas são filtradas pela coluna `tags` da conta:
- `tags` contém `"carteira"` → aparece em Carteira
- `tags` contém `"marketing"` → aparece em Marketing

Hoje, ao converter um lead em conta (botão "Converter em conta" no detalhe do lead), nenhuma tag é adicionada, então a conta fica só em "Todos".

## Mudanças

1. **Conversão de lead → conta** (`src/pages/LeadDetail.tsx`)
   - No `insert` em `public.contas`, incluir `tags: ['marketing']` (mesclando com quaisquer tags já vindas do form, sem duplicar).

2. **Backfill das conversões existentes** (migration SQL)
   - Para toda `conta` em que `lead_id_origem IS NOT NULL` e `tags` ainda não contém `'marketing'` nem `'carteira'`, acrescentar `'marketing'` ao array de tags.
   - Não mexe em contas criadas manualmente já classificadas como Carteira.

3. Sem alterações no funil, sem alterações de RLS, sem alterações no fluxo de criação manual de conta.

## Verificação
- Converter um lead novo → abrir Contas → subaba Marketing → conta aparece.
- Contas antigas que vieram de leads passam a aparecer em Marketing automaticamente após a migration.
