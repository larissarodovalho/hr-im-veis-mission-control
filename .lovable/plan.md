## Objetivo

Atualizar a Sofia para oferecer **4 formas de contato** com o corretor — videochamada, reunião presencial, ligação e WhatsApp — e disparar **notificação por email** ao admin quando o lead pedir contato imediato.

## Mudanças

### 1. Fluxo da Sofia (WhatsApp + Web Chat)

Atualizar prompts e ferramentas em `whatsapp-webhook/index.ts` e `public-chat/index.ts`:

- **Passo 3** passa a oferecer 4 opções: `videochamada`, `presencial`, `ligacao` ou `whatsapp`.
- Para cada opção, perguntar uma 2ª pergunta de **urgência**: "agora mesmo" (imediato) ou "agendar para outro horário".
- Se **agendar** → mantém fluxo atual (gera link `/agendar/{token}` com slot picker).
- Se **agora**:
  - Marca o lead como `contato_imediato` (tag + nota + etapa `Contato Imediato`).
  - **Não envia link de agendamento.**
  - Dispara email para o admin (Hans).
  - Sofia responde: "Show! Já avisei o Hans, ele vai te chamar agora mesmo 🚀".

### 2. Nova ferramenta `request_immediate_contact`

```
request_immediate_contact(kind: "videochamada"|"presencial"|"ligacao"|"whatsapp")
```

Handler no webhook:
1. Atualiza lead: `etapa_funil = "Contato Imediato"`, adiciona tag `urgente`, observação com tipo + timestamp.
2. Chama nova edge function `notify-immediate-contact` que envia email para o(s) admin(s).

### 3. Notificação por email

Usar **Lovable Emails** (infraestrutura built-in):
- Configurar domínio de email (dialog `<lov-open-email-setup>`).
- Criar template transacional `immediate-contact-alert.tsx` com: nome do lead, telefone, intenção, forma de contato pedida, link direto pro lead no CRM.
- Destinatários: todos os usuários com role `admin` (hoje só Hans → `larissadefreitas@hotmail.com`).
- Edge function `notify-immediate-contact` busca admins via `user_roles` + `profiles`, invoca `send-transactional-email` para cada um com `idempotencyKey = immediate-${lead_id}-${timestamp}`.

### 4. Banco de dados

Nenhuma mudança de schema obrigatória — usa campos existentes (`tags`, `observacoes`, `etapa_funil`).
Opcional: criar coluna `contato_imediato_em timestamptz` em `leads` para rastrear pedidos. **Vou pular para manter simples** — fica só nas observações + tag.

### 5. UI no CRM

- Em `src/pages/Leads.tsx`, leads com tag `urgente` ou etapa `Contato Imediato` ganham um badge vermelho "🔥 Contato Imediato" para o corretor priorizar.

## Detalhes técnicos

**Arquivos editados:**
- `supabase/functions/whatsapp-webhook/index.ts` — novo prompt, nova tool, handler
- `supabase/functions/public-chat/index.ts` — espelhar mudanças
- `src/pages/AgendarPage.tsx` — adicionar opção "WhatsApp" no slot picker (se kind=whatsapp, oferece slots normais — corretor liga via WhatsApp no horário)
- `src/pages/Leads.tsx` — badge de urgência

**Arquivos criados:**
- `supabase/functions/notify-immediate-contact/index.ts` — busca admins e envia email
- `supabase/functions/_shared/transactional-email-templates/immediate-contact-alert.tsx` — template

**Pré-requisitos (executados pelo agente):**
1. Configurar domínio de email (vai abrir o dialog para você).
2. Setup da infraestrutura de email (queue, tabelas, cron).
3. Scaffold de transactional emails.
4. Deploy de todas as edge functions afetadas.

## Pergunta antes de seguir

Para o email: vai usar o **domínio próprio da HR Imóveis** (ex.: `notify.hrimoveis.com.br`)? Se sim, precisarei do domínio que você quer usar quando abrir o dialog de setup. Caso contrário, posso seguir e te perguntar na hora.
