## Objetivo
Restringir a visibilidade de leads: apenas admin/gestor veem todos. Corretor, marketing e secretaria veem somente os leads atribuídos a si (`corretor_id = auth.uid()`) ou criados por si (`created_by = auth.uid()`).

## Mudanças (migration única na tabela `public.leads`)

1. **Remover** a policy permissiva ampla `Staff sees all leads (agenda)` — é ela que dá visão total para qualquer staff (corretor incluso).
2. **Remover** a policy `Secretaria sees leads` (visão total para secretaria) — substituída pela regra de "próprios leads".
3. **Manter**:
   - `Admin/gestor see all leads` (admin/gestor veem tudo)
   - `Corretor sees own leads` (`corretor_id = auth.uid() OR created_by = auth.uid()`) — passa a valer também para marketing e secretaria, pois a condição não depende de role.
   - Policies de UPDATE/DELETE/INSERT permanecem inalteradas.

Resultado: corretor (Douglas), marketing e secretaria só enxergam leads onde são `corretor_id` ou `created_by`. Admin/gestor continuam vendo tudo.

## Impacto colateral a verificar
- **Booking links / agenda pública**: edge functions `booking-info`/`booking-confirm` usam service role, não são afetadas pela RLS.
- **WhatsApp**: trigger `wa_set_responsavel` é SECURITY DEFINER, lê leads sem RLS — ok.
- **Páginas do CRM**: nenhuma alteração de código necessária; a UI já confia no que o Supabase retorna.

## Sem alterações de código frontend
Apenas migration SQL.