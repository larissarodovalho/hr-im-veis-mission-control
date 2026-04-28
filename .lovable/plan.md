## WhatsApp igual ao Brazil Lands

A infra Evolution (secrets, webhook, tabelas, realtime) já existe. Falta replicar os recursos da interface do Brazil Lands e fazer o envio realmente disparar via Evolution.

### O que vai mudar

1. **Banco** — adicionar campos que faltam:
   - `whatsapp_conversations.ai_enabled boolean default true`
   - `whatsapp_messages.author text default 'humano'` (`humano` | `ia`)

2. **Envio funcionando de verdade** (`src/pages/WhatsApp.tsx`):
   - Hoje só faz `insert` no banco — nada chega no celular do cliente.
   - Passa a chamar `supabase.functions.invoke("whatsapp-send", { body: { conversation_id, content } })`, igual Brazil Lands.

3. **Edge function `whatsapp-send`** atualizada:
   - Validar usuário autenticado (Bearer token).
   - Receber `{ conversation_id, content }`, buscar telefone da conversa.
   - Disparar via Evolution e gravar a mensagem com `author: "humano"`.
   - Atualizar `last_message_at` / `last_message_preview` da conversa.

4. **Toggle IA / Humano por conversa**:
   - Switch no header da conversa: ativa/desativa `ai_enabled`.
   - Lista de conversas mostra "🤖 IA" ou "👤 Humano".
   - Toast confirmando ação.

5. **Badge de não-lidas**:
   - Hook `useWhatsAppUnread` (badge global no menu lateral).
   - Hook `useWhatsAppPerConvUnread` (badge por conversa, só conta inbound em conversas Humano).
   - Persistência do "última vez visto" em `localStorage`.
   - `AppLayout` exibe badge ao lado do item "WhatsApp".

6. **Editar / excluir conversa**:
   - Botão de editar telefone (normaliza para formato `55…`).
   - Botão de excluir conversa (somente admin) com `AlertDialog` de confirmação.

7. **Deep-link de Lead → conversa**:
   - Suporte a `?conv={id}` na URL para abrir direto a conversa quando vindo da tela do Lead.

8. **Renderização de mensagens**:
   - Links viram `<a target="_blank">` clicáveis.
   - Badge do autor (Bot/User) em cada balão.
   - Auto-scroll para a última mensagem.

### Arquivos afetados

- Migration nova (campos `ai_enabled`, `author`)
- `supabase/functions/whatsapp-send/index.ts` (reescrita simples, sem mudar o webhook)
- `src/pages/WhatsApp.tsx` (substituição completa pela versão Brazil Lands)
- `src/hooks/useWhatsAppUnread.tsx` (novo)
- `src/hooks/useWhatsAppPerConvUnread.tsx` (novo)
- `src/components/AppLayout.tsx` (badge no item WhatsApp)

### O que NÃO muda

- Webhook (`whatsapp-webhook`) — já funciona, recebe Evolution e salva.
- Secrets `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME` — já configurados.
- Tabelas e RLS existentes preservados (apenas acrescento campos).

### Observação sobre a Evolution

A `whatsapp-send` já existente usa a env `EVOLUTION_INSTANCE_NAME`; a do Brazil Lands usa `EVOLUTION_INSTANCE`. Vou manter `EVOLUTION_INSTANCE_NAME` (que já está configurada neste projeto) para não pedir nada novo a você.
