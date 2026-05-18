## Problema

Hoje o webhook do WhatsApp dispara a resposta da Sofia **toda vez** que chega uma mensagem do lead. Quando o lead manda 2–3 balões seguidos, a Sofia acaba respondendo o primeiro balão (e às vezes responde de novo aos próximos), sem considerar a sequência completa.

## Solução: janela de "debounce" por conversa

Antes de gerar a resposta, a Sofia espera alguns segundos para ver se o lead vai mandar mais balões. Se vier outra mensagem nesse intervalo, a execução antiga é descartada e só a nova (que agora já vê todo o histórico atualizado) responde. Resultado: Sofia responde **uma vez só**, considerando todos os balões na ordem em que chegaram.

### Como funciona

1. Cada nova mensagem inbound recebe um "token" único e grava na conversa o campo `ai_debounce_token` (último token) e `ai_pending_since` (carimbo de tempo).
2. A mensagem é salva normalmente em `whatsapp_messages` (sem mudar o histórico que o painel já mostra).
3. Antes de chamar a IA, a função aguarda ~8 segundos e relê `ai_debounce_token` da conversa.
   - Se o token mudou → outra mensagem chegou depois; encerra silenciosamente esta execução.
   - Se continua igual → carrega o histórico completo atualizado (já incluindo todos os balões que chegaram nesse intervalo) e gera **uma única resposta**.
4. A resposta é enviada normalmente para o WhatsApp e salva como `outbound`.

### Detalhes técnicos

- Migration: adicionar colunas `ai_debounce_token text` e `ai_pending_since timestamptz` em `whatsapp_conversations` (nullable, sem default). Nenhuma RLS nova.
- `supabase/functions/whatsapp-webhook/index.ts`:
  - Gerar `token = crypto.randomUUID()` ao receber a mensagem.
  - Após o `insert` em `whatsapp_messages` e antes do bloco de IA, atualizar a conversa com `{ ai_debounce_token: token, ai_pending_since: ts }`.
  - Adicionar `await new Promise(r => setTimeout(r, 8000))` (janela configurável por constante `AI_DEBOUNCE_MS`).
  - Reler `ai_debounce_token` da conversa; se diferente de `token`, retornar `{ ok: true, debounced: true }` sem chamar IA.
  - Se igual, prosseguir com o fluxo atual (que já recarrega o histórico das últimas mensagens, então a Sofia "verá" todos os balões juntos).
- Manter os atalhos determinísticos atuais (handoff, link de agenda) dentro do mesmo bloco, depois da checagem do token, para que também respeitem a sequência completa.
- Sem mudanças no frontend.

### O que NÃO muda

- Cada balão do lead continua aparecendo individualmente no painel do WhatsApp em tempo real.
- Áudio continua sendo transcrito por balão.
- Lead continua sendo movido de "Novo Lead" para "Em Contato" no primeiro balão.
- Quando o usuário desabilita IA na conversa, o comportamento continua igual.