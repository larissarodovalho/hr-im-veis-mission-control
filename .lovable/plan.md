# Plano — Opção A: Aceitar finding de Realtime

## O que será feito

1. **Marcar finding como ignorado** (`realtime_channel_topic_not_scoped`) com justificativa técnica:
   > Todos os 22 canais Realtime do projeto usam `postgres_changes` (não Broadcast). O Postgres reaplica RLS de cada tabela base antes de entregar eventos ao cliente, então os dados já são protegidos no nível da tabela (signed_documents, document_signers, whatsapp_messages, leads, contas, etc). A policy ampla em `realtime.messages` apenas permite a inscrição no canal — não vaza dados que o usuário já não possa ler.

2. **Atualizar `@security-memory`** registrando:
   - Arquitetura: todos os canais Realtime usam `postgres_changes` + RLS na tabela base.
   - Decisão aceita: não exigir scoping por tópico em `realtime.messages` enquanto não houver uso de Broadcast.
   - Regra futura: se algum dia introduzirmos `broadcast` ou `presence`, refatorar nomes de canais para incluir IDs e criar policy com regex.

## O que NÃO será feito

- Nenhuma alteração de código (frontend ou backend).
- Nenhuma migração SQL.
- Nenhum canal Realtime será renomeado.

## Risco

Zero risco de regressão. Apenas metadados de segurança e documentação.
