## Objetivo

Classificar todas as **1.355 contas** da base como **Carteira**, para começar a qualificação e nutrição pela aba Carteira em `/app/contas`.

## Situação atual

- Total: **1.355** contas
- Já marcadas como `carteira`: **0**
- Marcadas como `marketing`: **0**

## Operação

Atualização em massa na tabela `contas`, adicionando `"carteira"` ao array `tags` de toda conta que ainda não tenha essa tag. Demais tags (ex.: `importado-2026-05`, `hr-imoveis`, `dono:...`) são preservadas.

```sql
UPDATE public.contas
SET tags = array_append(COALESCE(tags, ARRAY[]::text[]), 'carteira')
WHERE NOT ('carteira' = ANY(COALESCE(tags, ARRAY[]::text[])));
```

Como nenhuma conta está em `marketing`, não há conflito a resolver.

## Resultado esperado

- 1.355 contas com tag `carteira`
- Visíveis na aba **Carteira** de `/app/contas`
- Nenhuma alteração de schema, RLS ou outras tabelas

## Reversão (se precisar)

```sql
UPDATE public.contas
SET tags = array_remove(tags, 'carteira');
```
