## Sofia simplificada — captação + handoff com agendamento/contato imediato

### Novo fluxo (4 passos)

1. **Nome completo** — "Olá! Sou a Sofia, da HR Imóveis. Para começar, qual seu nome completo?" Se vier só primeiro nome, pede sobrenome. Salva via `update_lead_info`.

2. **Celular** — "Esse mesmo número de WhatsApp é o melhor para o corretor te chamar, ou prefere outro?" Salva (se diferente). No fluxo da página de captura, pergunta o celular diretamente.

3. **Tipo de interesse** — UMA pergunta:
   "O que você procura: comprar, vender, alugar, incorporar, ou um investimento de ocasião?"
   Salva como `interest` (enum: `compra`, `venda`, `aluguel`, `incorporacao`, `investimento_ocasiao`).

4. **Handoff com escolha** — Após coletar os 3 dados:
   "Perfeito, [Nome]! Agora me diz: você prefere **agendar** uma conversa com nosso corretor especialista (videochamada, reunião presencial, ligação ou WhatsApp) ou **falar agora mesmo**?"
   - Se escolher AGENDAR → pergunta o formato (vídeo / presencial / ligação / WhatsApp) → chama `send_booking_link` com o `kind` correspondente. Sistema anexa o link automaticamente.
   - Se escolher AGORA → pergunta o formato → chama `request_immediate_contact` com o `kind`. Texto: "Pronto! Já avisei o corretor, ele vai te chamar em instantes."

Sem perguntas extras de região, faixa, prazo, etc. Sem discovery aprofundado.

### Alterações em `supabase/functions/whatsapp-webhook/index.ts`

1. **Reescrever `AI_SYSTEM`** com os 4 passos acima. Remover o discovery longo, "REGRA DE OURO" anti-link, urgência inferida, etc. Manter:
   - Tom (informal, sem emojis, sem gírias, uma pergunta por mensagem).
   - Retomada: se o lead voltar depois com saudação, cumprimentar e perguntar em que ajudar — sem reenviar link automaticamente.
   - Anti-loop simples: se já agendou ou disparou contato imediato, não chamar as tools de novo.

2. **Atualizar `update_lead_info`**: aceitar `full_name`, `phone` (opcional), `interest` com enum expandido (`compra`, `venda`, `aluguel`, `incorporacao`, `investimento_ocasiao`).

3. **Manter** `send_booking_link` e `request_immediate_contact` (com `kind`: videochamada/presencial/ligacao/whatsapp). Só podem ser chamadas após os 3 dados coletados — controlar por instrução no prompt + checagem leve no servidor (se faltar nome ou interesse, ignorar a tool e voltar à pergunta pendente).

4. **Remover** as guard rails antigas (`hasExplicitBookingConsent`, `isGreetingOnly`, "intent vazado") — substituir por: só permite tools depois de ter `full_name` + `interest` no lead.

### Alterações em `supabase/functions/public-chat/index.ts`
Mesmo prompt e tools, adaptado para a página de captura (pede o celular explicitamente já que não vem do WhatsApp).

### `src/pages/CapturaPage.tsx`
Mantém o botão "Escolher horário" (`bookingUrl`) — agora será usado de novo.

### Sem mudanças
- Schema do banco (não precisa migração; `interest` é texto).
- `booking-confirm`, `booking-info`, geração de token de agendamento.
- `notify-immediate-contact` (continua disparando email ao Hans no contato imediato).

### Deploy
Redeploy `whatsapp-webhook` e `public-chat`.
