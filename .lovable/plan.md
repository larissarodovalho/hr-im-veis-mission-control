## Objetivo
Ao converter um lead em conta, migrar automaticamente todo o histórico de interações do lead para a nova conta, para que apareçam no timeline da conta em Marketing.

## Mudanças

**`src/pages/LeadDetail.tsx`** (função `doConvert`, logo após o insert bem-sucedido em `contas`)
- Se `created?.id` existir, executar:
  ```ts
  await supabase.from("interacoes")
    .update({ conta_id: created.id })
    .eq("lead_id", lead.id)
    .is("conta_id", null);
  ```
- Isso vincula as interações existentes do lead à conta, sem duplicar. Elas continuam com `lead_id` também (rastreabilidade), e passam a aparecer no timeline da conta (que filtra por `conta_id`).
- Erro na migração é apenas logado (não bloqueia a conversão).

## Backfill (uma vez, via insert tool)
Para as 11 contas já convertidas, preencher `conta_id` nas interações órfãs:
```sql
UPDATE public.interacoes i
SET conta_id = c.id
FROM public.contas c
WHERE c.lead_id_origem = i.lead_id
  AND i.conta_id IS NULL;
```

## Observações
- Não altera schema; usa colunas existentes (`interacoes.lead_id` e `interacoes.conta_id`).
- Não mexe em `lead_historico` (log interno do lead, não é exibido na conta).