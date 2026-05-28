## Plano de correção de segurança

Vou ajustar as RLS policies do Supabase para resolver os findings, respeitando suas decisões:

### 1. `booking_links` (corrigir — error)
- Substituir policy SELECT atual por:
  - admin/gestor: vê tudo
  - corretor: só vê links onde `created_by = auth.uid()` OU o `lead_id`/`reuniao_id` pertence a ele

### 2. `signed_documents` + `document_signers` (corrigir — error)
- SELECT em `signed_documents`:
  - admin/gestor: vê tudo
  - demais staff: só vê quando `created_by = auth.uid()` OU `lead_id`/`conta_id` pertence ao usuário (via responsavel_id/corretor_id/created_by da conta/lead)
- SELECT em `document_signers`:
  - mesma regra via join em `signed_documents`
- `document_events` segue o mesmo escopo (consistência)

### 3. `conteudo_posts` (corrigir — warn)
- Adicionar `marketing` nas policies de SELECT, INSERT e UPDATE (admin/gestor + marketing)

### 4. `reunioes` e `agenda_bloqueios` (manter compartilhado)
- Você confirmou que a agenda é compartilhada para todo o staff. Vou manter as policies atuais e marcar os 2 findings (`reunioes_public_select`, `agenda_bloqueios_broad_read`) como **ignorados** no scanner, com justificativa registrada no security memory ("agenda compartilhada é requisito de produto").

### Entregáveis
- 1 migração SQL com DROP/CREATE das policies acima
- Atualização do security memory documentando o que é intencionalmente compartilhado
- Marcar findings resolvidos como `mark_as_fixed` e os 2 da agenda como `ignore`

Nenhuma mudança em código de UI será necessária — as policies novas continuam permitindo o que o admin/gestor já fazia, e cada corretor continuará vendo o que ele criou.