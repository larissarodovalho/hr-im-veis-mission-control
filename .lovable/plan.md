## Problema

Investiguei o caso da Larissa Rodovalho. Encontrei 3 problemas distintos:

### 1. Lead existe, mas sumiu do kanban de Leads
A Larissa **está cadastrada** (id `4f3a1...`, vinculada à conversa do WhatsApp). O problema é que o webhook da Sofia move o lead para etapas **"Em Atendimento"** e **"Contato Imediato"** — mas o kanban (`src/lib/leads.ts`) só tem 8 colunas fixas: `Novo Lead, Em Contato, Conversa Ativa, Reunião Agendada, Visita, Proposta, Fechado, Perdido`. Como `etapa_funil` não bate com nenhuma coluna, o card simplesmente não aparece em lugar nenhum.

### 2. Badge de não-lidas não aparece quando IA está atendendo
O hook `useWhatsAppPerConvUnread` filtra `humanIds = convs.filter(c => !c.ai_enabled)` — ou seja, **só conta não-lidas em conversas onde a IA foi desativada**. O badge no menu lateral (`AppLayout`) usa outro hook (`useWhatsAppUnread`) que conta todas inbound, mas o badge **por conversa** dentro da página WhatsApp ignora qualquer mensagem enquanto a IA estiver ligada. Resultado: você não vê quais conversas têm mensagens novas que precisam de atenção humana.

### 3. E-mail de contato imediato não está chegando
A função `notify-immediate-contact` busca admins via `user_roles` e cai em fallback para `larissadefreitas@hotmail.com`. Precisa confirmar nos logs se está sendo invocada e se há admin cadastrado com e-mail correto do Hans. O webhook chama, mas não bloqueia em erro — pode estar falhando silenciosamente.

---

## Solução

### Parte 1 — Alinhar o funil do WhatsApp com o kanban

**Mudar o webhook (`supabase/functions/whatsapp-webhook/index.ts`)** para usar etapas que **existem** no kanban:

- Quando a IA confirma intenção (`update_lead_info` com `interest`) → mover de `Novo Lead` para **`Em Contato`** (não "Em Atendimento").
- Quando o lead responde algo (qualquer inbound após o primeiro) e ainda está em `Novo Lead` → mover para **`Em Contato`** automaticamente.
- Quando o lead pede contato imediato (`request_immediate_contact`) → mover para **`Conversa Ativa`** + adicionar tag `urgente` (que já vira o badge 🔥 vermelho que existe em `Leads.tsx` linha 30-31).
- Quando o lead pede agendamento (`send_booking_link`) → mover para **`Conversa Ativa`**.

Assim, todo lead que entra pelo WhatsApp passa por `Novo Lead → Em Contato → Conversa Ativa` no kanban, e os "quentes" ganham o badge 🔥 destacado.

**Migration de dados:** atualizar leads existentes que estão em `Em Atendimento` ou `Contato Imediato` para `Conversa Ativa` (com tag `urgente` quando vinha de "Contato Imediato"), para a Larissa e outros voltarem a aparecer.

### Parte 2 — Badge de não-lidas em modo humano E modo IA

Mudar `useWhatsAppPerConvUnread` para **contar não-lidas em TODAS as conversas** (não só humanas). Razão: mesmo com a Sofia respondendo, você quer ver no menu lateral e na lista de conversas quais têm mensagens novas para acompanhar.

Adicionalmente, no `WhatsApp.tsx` o `markConvSeen` é chamado quando você seleciona a conversa **mesmo que a IA esteja respondendo** — ok, esse comportamento fica. O importante é que mensagens que chegam em conversas **não abertas** sempre incrementem o contador, independente do `ai_enabled`.

### Parte 3 — Garantir que o e-mail de contato imediato chegue

1. Verificar nos logs da função `notify-immediate-contact` se foi invocada quando a Larissa pediu contato (provavelmente foi, porque etapa virou "Contato Imediato").
2. Verificar se há um perfil admin com email do Hans em `profiles` + `user_roles`. Se não houver, o fallback envia para `larissadefreitas@hotmail.com` — perguntar ao usuário qual o e-mail correto que deve receber esses alertas.
3. Adicionar log de erro mais explícito no webhook caso a invocação do `notify-immediate-contact` falhe (hoje só faz `console.error` — pelo menos garantir que registra).

---

## Detalhes técnicos

**Arquivos alterados:**

- `supabase/functions/whatsapp-webhook/index.ts`
  - Trocar `etapa_funil: "Em Atendimento"` → `"Em Contato"` (linha ~554)
  - Trocar `etapa_funil: "Contato Imediato"` → `"Conversa Ativa"` (linha ~618)
  - No bloco de `bookingKind`, mudar de `"Em Atendimento"` para `"Conversa Ativa"` (linha ~671)
  - Quando inbound chega e lead está em `Novo Lead`, mover para `Em Contato` (novo bloco antes do retorno IA)

- `src/hooks/useWhatsAppPerConvUnread.tsx`
  - Remover filtro `humanIds`. Contar não-lidas em todas as conversas. Renomear estado se quiser, mas a interface (`unreadByConv`, `markConvSeen`, `totalUnread`) permanece.
  - Em `WhatsApp.tsx` (linha 276), remover a checagem `!c.ai_enabled ? ... : 0` para mostrar o badge sempre.

- `src/components/AppLayout.tsx` — sem mudança (já usa contador global).

- **Migration SQL** (data fix, não schema):
  ```sql
  UPDATE leads
  SET etapa_funil = 'Conversa Ativa',
      tags = CASE
        WHEN etapa_funil = 'Contato Imediato'
          THEN array(SELECT DISTINCT unnest(coalesce(tags, ARRAY[]::text[]) || ARRAY['urgente']))
        ELSE tags
      END
  WHERE etapa_funil IN ('Em Atendimento', 'Contato Imediato');
  ```

**Pergunta antes de executar:** qual e-mail deve receber os alertas de contato imediato? Hoje o fallback (quando não há admin com e-mail no `profiles`) está enviando para `larissadefreitas@hotmail.com`. Confirma se é esse mesmo, ou quer trocar para outro (ex.: e-mail do Hans)?
