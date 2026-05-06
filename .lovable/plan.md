## Contexto

A aba **Reuniões** foi corrigida recentemente para evitar erro 400 no Supabase (causado por join implícito `reunioes -> leads` sem foreign key declarada) e para garantir que ligações/reuniões criadas via link público (booking-confirm) sempre tenham `corretor_id` preenchido — caso contrário ficavam invisíveis no CRM por causa do RLS.

A aba **Ligações** (`src/pages/Calls.tsx`) ainda usa o mesmo padrão problemático:

```ts
supabase.from("ligacoes").select("*, leads(id,nome)")
```

Hoje a tabela `ligacoes` está vazia (0 registros), então o problema ainda não apareceu na prática — mas assim que a IA/Sofia agendar uma ligação via link, o mesmo bug do Meetings vai ocorrer: a chamada falha (400) ou o registro fica oculto.

## Verificações já feitas

- `booking-confirm` já preenche `corretor_id` e `created_by` com fallback para admin/gestor/corretor. OK.
- `booking-info` já lê de `ligacoes` corretamente. OK.
- RLS de `ligacoes`: visível somente para admin/gestor, ou quando `corretor_id = auth.uid()` ou `created_by = auth.uid()`. Mesmo padrão de `reunioes`.

## Mudanças

### 1. `src/pages/Calls.tsx` — eliminar join implícito

Trocar a query única com join por duas queries (igual ao fix do Meetings):

- `select("*")` em `ligacoes` ordenado por `data desc`
- `select("id, nome")` em `leads` filtrando pelos `lead_id` distintos
- merge no frontend via `Map`
- fallback de exibição: se `lead_id` existir mas o lead não for visível/encontrado, mostrar "Lead removido"; se `lead_id` for null, mostrar "Sem lead"

### 2. Backfill defensivo (opcional, só roda se houver órfãos)

Como a tabela está vazia hoje, não é necessário rodar migration. Mas, por segurança, incluir um SQL idempotente que atribui ao corretor padrão (Hans `5e6a90fc-c806-4cd9-8dfe-9067126ece93`) qualquer `ligacoes` futura que entre com `corretor_id IS NULL`. Faremos isso via migration:

```sql
UPDATE public.ligacoes
SET corretor_id = '5e6a90fc-c806-4cd9-8dfe-9067126ece93',
    created_by  = COALESCE(created_by, '5e6a90fc-c806-4cd9-8dfe-9067126ece93')
WHERE corretor_id IS NULL;
```

(roda uma vez; não afeta nada se não houver linhas.)

### 3. Sem alterações em `booking-confirm` / `booking-info`

Já estão corretos para o fluxo de "ligação".

## Resultado esperado

- Ligações criadas pela Sofia/link público aparecem imediatamente na aba **Ligações** e nos relatórios, atribuídas ao corretor padrão quando o lead não tiver corretor.
- Sem mais erro 400 ao carregar a aba Ligações.
- Mesma robustez já aplicada à aba Reuniões.

Após aplicar, será necessário **Publicar** para sincronizar com `hrimoveis.com`.
