# Importação das 1.358 contas (HR Imóveis)

## Resumo
Importar a planilha `Novo_relatório_Contatos_e_contas-2026-05-17` direto na tabela `contas` via script, atribuindo todas ao Hans Rodovalho (representando HR Imóveis), pulando qualquer conta que já exista hoje em `contas` ou `leads`.

## Mapeamento de campos
| Planilha | Campo `contas` |
|---|---|
| Nome da conta (fallback: Primeiro + Sobrenome) | `nome` |
| Celular (fallback: Telefone) | `telefone` (normalizado) |
| Email | `email` (lowercase) |
| Cidade + Estado (quando houver) | `endereco` |
| Cargo (quando houver) | `observacoes` |
| — | `tipo` = `PF` |
| — | `etapa_funil` = `a_contatar` |
| — | `status` = `ativo` |
| — | `responsavel_id` = `6132fe03-…` (Hans) |
| — | `created_by` = Hans |
| — | `tags` = `['importado-2026-05', 'hr-imoveis']` + (sufixo do proprietário original: `dono:gabriel-souza`, `dono:hans-rodovalho`, `dono:rafael-filimberti`) para rastreabilidade e futura reatribuição |

Campos descartados: País (sempre "United States" — lixo do export), Fax, CEP, Tratamento.

## Regras de dedupe (pular)
Para cada linha, considero duplicata e **pulo** se bater com algum registro existente em `contas` ou `leads` por:
- `email` (case-insensitive), ou
- últimos 8 dígitos do `telefone`

Também dedupo dentro do próprio arquivo (não inserir duas vezes a mesma linha).

## Processo
1. **Pré-carregar índices** de `contas(email, telefone)` e `leads(email, telefone)` para dedupe rápido em memória.
2. **Ler** a planilha (cabeçalho na linha 9, dados a partir da linha 10).
3. **Transformar** cada linha aplicando o mapeamento acima e o dedupe.
4. **Inserir** em lotes de 200 via `supabase--insert`.
5. **Relatório final** com: total processado, inseridas, duplicadas puladas (com motivo), linhas inválidas (sem nome).

## Rollback
Se algo der errado, basta `DELETE FROM contas WHERE 'importado-2026-05' = ANY(tags)` — a tag isola o lote.

## Pontos técnicos
- Vou usar o tool `supabase--insert` em lotes; sem alterações de schema.
- Nenhuma alteração em código da aplicação (frontend/edge functions intocados).
- Reatribuir Gabriel/Rafael depois é trivial: filtrar pela tag `dono:gabriel-souza` / `dono:rafael-filimberti` e fazer update do `responsavel_id` quando os usuários forem criados.

## Entregáveis
- Contas importadas no CRM, visíveis em `/app/contas`.
- Relatório (JSON/Markdown) com contagens e amostra das duplicatas puladas, salvo em `/mnt/documents/importacao-contas-2026-05.md`.
