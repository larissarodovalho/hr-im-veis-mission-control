## Objetivo

Permitir que um admin desligue **globalmente** a assistente Sofia (IA do WhatsApp). Quando desativada, nenhuma conversa nova ou existente recebe resposta automática da IA — o atendimento fica 100% humano — independente do toggle por conversa.

## Onde fica o controle

Aba **Configurações → Sistema**, novo card "Assistente virtual Sofia" com:
- Switch "Sofia ativa para atendimento por WhatsApp"
- Texto explicativo: quando desligada, a IA não responde nenhuma conversa, mesmo as que estão com IA ligada individualmente.
- Estado atual lido do backend; salva ao alternar.

Visível/editável apenas para admin/gestor (usa `is_admin()`). Para os demais o card aparece desabilitado.

## Armazenamento

Reaproveitar a tabela existente `site_settings` (já usada para imagens/destaques), adicionando uma nova chave:

```
key   = 'ai_assistant'
value = { "whatsapp_enabled": true }
```

Sem migração de schema — apenas um upsert nesta linha. Default = ativo (se a linha não existir, considera ativo).

## Backend (whatsapp-webhook)

Antes de chamar o modelo de IA na `supabase/functions/whatsapp-webhook/index.ts` (perto das verificações atuais de `conv.ai_enabled`), buscar `site_settings` onde `key='ai_assistant'`. Se `value.whatsapp_enabled === false`, pular geração de resposta da IA (segue salvando a mensagem recebida normalmente, apenas não responde).

Dois pontos no arquivo onde essa checagem entra (linhas ~893 e ~921, junto das checagens `ai_enabled === false`).

## Frontend

- `src/lib/siteSettings.ts`: adicionar `fetchAiAssistant()` e `saveAiAssistant({ whatsapp_enabled })` seguindo o mesmo padrão de upsert por `key`.
- `src/pages/ConfiguracoesPage.tsx` aba `sistema`: novo card com Switch controlado, `toast` de confirmação e indicação visual quando estiver desligado (badge "Sofia pausada").
- Opcional (UX): na página WhatsApp, quando a Sofia global estiver off, mostrar um banner pequeno no topo: "Sofia desativada globalmente — todas as conversas estão no humano".

## Detalhes técnicos

- Política de leitura de `site_settings` já permite leitura; gravação restrita a staff/admin (verificar policies atuais e, se necessário, garantir update pelo admin — sem mudança de schema, só de policy se faltar).
- Cache: invalidar leitura no frontend após save.
- Sem mudança nas policies de `whatsapp_conversations` ou `whatsapp_messages`.

## Arquivos afetados

- `src/pages/ConfiguracoesPage.tsx` (novo card na aba Sistema)
- `src/lib/siteSettings.ts` (helpers de leitura/escrita do flag)
- `supabase/functions/whatsapp-webhook/index.ts` (checagem global antes de responder)
- `src/pages/WhatsApp.tsx` (opcional: banner informativo)
