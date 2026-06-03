## Objetivo

Quando um lead chegar via Meta Lead Ads, salvar todas as perguntas e respostas do formulário e mostrá-las no detalhamento do lead, para qualificar o interesse.

## Mudanças

### 1. Banco (migração)
- Adicionar coluna `meta_form_data jsonb` na tabela `leads` (nullable). Vai guardar `{ form_nome, form_id, page_id, leadgen_id, respostas: [{ campo, valor }] }`.

### 2. Webhook `meta-leadgen-webhook`
- Em `processLeadgen`, montar um array `respostas` a partir de `lead.field_data` preservando a ordem e o label original de cada pergunta (`name` → `valor`).
- Salvar em `meta_form_data` no insert do lead, junto com `form_nome`, `form_id`, `page_id`, `leadgen_id`.
- Manter o `observacoes` atual como fallback humano.

### 3. UI — `src/pages/LeadDetail.tsx`
- Buscar `meta_form_data` junto com o lead.
- Quando existir, renderizar um card "Respostas do formulário (Meta Ads)" logo abaixo do bloco de dados do lead, listando cada pergunta e resposta em formato chave → valor, com o nome do formulário no título.
- Esconder o card quando `meta_form_data` for nulo.

## Fora de escopo
- Leads antigos já criados continuam sem `meta_form_data` (não há backfill — os dados originais não estão guardados).
- Nenhuma mudança em outras telas/listagens.
