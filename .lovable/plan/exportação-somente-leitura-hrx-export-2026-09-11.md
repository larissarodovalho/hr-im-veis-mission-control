# Exportação somente leitura (hrx-export)

Nova função pública `hrx-export` para outro sistema ler os dados do CRM, protegida por uma chave secreta. Ela apenas lê — nunca cria, altera ou apaga nada.

## Como funciona

- Quem chama precisa enviar a chave no cabeçalho `x-hrx-key`. Sem a chave certa, resposta 401 e nada é retornado.
- Parâmetros aceitos:
  - `entity`: um de `agents`, `leads`, `accounts`, `opportunities`, `proposals`, `visits`, `sales`
  - `since`: data/hora ISO (opcional; padrão = tudo)
  - `cursor`: posição de continuação no formato `updated_at|id`
  - `limit`: até 500 (padrão 100)
- Cada entidade lê uma tabela: perfis, leads, contas, oportunidades, propostas de oportunidade, visitas de oportunidade e fechamentos.
- Filtra por data de atualização a partir de `since`, ordena por data de atualização e depois por identificador, sempre crescente.
- Resposta: `{ "items": [ ...linhas completas... ], "next_cursor": "..." | null }`. Quando não há mais páginas, `next_cursor` vem nulo.

## Detalhes técnicos

- Arquivo: `supabase/functions/hrx-export/index.ts`, com `verify_jwt = false` em `supabase/config.toml` (autenticação é a chave própria).
- Segredo `HRX_EXPORT_KEY` solicitado pelo formulário seguro; comparação em tempo constante.
- Cliente Supabase criado com a service role apenas para `select`; nenhum `insert/update/delete/rpc` no código.
- Validação de entrada com Zod: `entity` restrito à lista, `limit` inteiro 1–500, `since` datetime ISO, `cursor` no padrão `<timestamp>|<uuid>`.
- Paginação keyset: `or(updated_at.gt.<ts>, and(updated_at.eq.<ts>, id.gt.<id>))`, `order("updated_at").order("id")`, `limit(n)`. `next_cursor` = `updated_at|id` da última linha quando vierem exatamente `n` linhas.
- Todas as tabelas confirmadas com `id` e `updated_at`.
- CORS liberado (`npm:@supabase/supabase-js@2/cors`), respostas 400 (parâmetro inválido), 401 (chave inválida), 405 (método diferente de GET/POST/OPTIONS), 500 (erro interno sem detalhe sensível).

## Passos

1. Criar a função com validação, autenticação por chave e paginação.
2. Registrar em `config.toml`.
3. Pedir o valor do segredo `HRX_EXPORT_KEY`.
4. Testar cada entidade: sem chave, com chave, com `since`, e paginação com `cursor`.
