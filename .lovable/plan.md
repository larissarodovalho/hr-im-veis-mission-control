# Ajuste do comportamento da Sofia (WhatsApp)

## Problema observado

Hoje a Sofia segue um fluxo rígido (nome → intenção → forma de contato → urgência → **dispara link de agendamento**). Isso faz ela despejar o link de agendar logo nas primeiras mensagens, mesmo quando o lead só queria tirar uma dúvida ou ainda não pediu para falar com o Hans.

Além disso, quando o lead volta dias depois ("bom dia", "oi de novo"), ela não cumprimenta de novo nem pergunta o que ele precisa — ou pior, pode tentar mandar o link mais uma vez.

## Objetivo

A Sofia deve:
1. Acolher e **descobrir o que o lead quer** antes de propor agendamento.
2. **Só oferecer agendamento quando o lead demonstrar interesse claro** em falar com o Hans (ou quando ela já tiver entendido a necessidade e fizer sentido propor).
3. Em retornos do lead ("bom dia novamente", "oi", "tudo bem?") → cumprimentar de volta e **perguntar de novo no que pode ajudar**, sem repetir agendamento.

## Alterações

### 1. `supabase/functions/whatsapp-webhook/index.ts` — Prompt da Sofia (`AI_SYSTEM`)

Reescrever o fluxo para ser **consultivo**, não transacional:

- **Passo 1**: apresentação + nome (mantém).
- **Passo 2 (NOVO)**: perguntar **como pode ajudar** / o que ele procura (ex.: "Me conta, em que posso te ajudar hoje? Está procurando algum imóvel, quer vender o seu, ou tem outra dúvida?"). Coletar contexto antes de qualquer agendamento.
- **Passo 3**: aprofundar a necessidade (região, tipo de imóvel, faixa, prazo) com 1–2 perguntas curtas — sem virar interrogatório.
- **Passo 4 (gatilho de agendamento)**: só propor falar com o Hans quando:
  - o lead pedir explicitamente ("quero falar com o corretor", "como agendo", "pode me ligar"), **ou**
  - já houver contexto suficiente e ela perguntar primeiro: *"Quer que eu agende uma conversa com o Hans pra detalhar isso?"* — e o lead **aceitar**.
- **Passo 5**: aí sim perguntar forma de contato (videochamada/presencial/ligação/WhatsApp) + urgência → chamar `send_booking_link` ou `request_immediate_contact`.

### 2. Regras anti-link-precoce (novas, no prompt)

Adicionar regras explícitas:
- **NUNCA** chamar `send_booking_link` antes de o lead confirmar que quer falar com o Hans.
- Se o lead só fez pergunta informativa (preço, bairro, financiamento) → responder de forma acolhedora ("Ótima dúvida, o Hans tem várias opções nessa região…") e **só então** perguntar se ele quer que agende uma conversa. Não mandar link sem confirmação.
- Se o lead disse "depois eu vejo", "vou pensar", "ainda não decidi" → **não** insistir, **não** mandar link. Encerrar gentil.

### 3. Tratamento de retorno / reabertura de conversa

Adicionar bloco "RETOMADA DE CONVERSA":
- Se a última mensagem da Sofia foi há mais de algumas horas e o lead voltar com saudação ("bom dia", "oi", "boa tarde", "voltei"), ela deve:
  - cumprimentar de volta pelo nome,
  - **perguntar novamente no que pode ajudar agora** ("Bom dia, [Nome]! Em que posso te ajudar hoje?"),
  - **não** reenviar link nem repetir o fluxo do zero.
- Já existe a regra "NUNCA chame send_booking_link de novo" no encerramento — reforçar e estender para qualquer retomada.

### 4. Fallback de resposta (código)

No bloco `if (!reply) { ... }` (linhas ~651–657), o fallback atual quando já tem nome é pular direto para "quer comprar/vender/alugar". Trocar por uma pergunta mais aberta:
- "Legal, [Nome]! Me conta, em que posso te ajudar hoje?"

E remover o caminho que infere `bookingKind` automaticamente do "intent vazado" quando o lead **não** pediu agendamento — manter a inferência apenas para `immediateKind` quando há sinal claro de urgência. Isso evita que um vazamento do LLM vire link mandado sem o lead pedir.

### 5. Anti-loop ajustado

A regra atual (linhas 106–110) força `send_booking_link` após 2 perguntas sem resposta clara. Trocar por:
- Após 2 tentativas sem clareza → encerrar educadamente ("Sem problema, quando precisar é só me chamar de volta!") em vez de mandar link.

## Sem mudanças

- Estrutura das tools (`update_lead_info`, `send_booking_link`, `request_immediate_contact`) permanece.
- Geração do token e tabela `booking_links` permanecem.
- Fluxo de `request_immediate_contact` (urgência real) permanece — quando lead pede "agora", ela continua avisando o Hans imediatamente.

## Arquivos afetados

- `supabase/functions/whatsapp-webhook/index.ts` (prompt `AI_SYSTEM` + ajuste no fallback de `reply` + ajuste no bloco de "intent vazado").

Após aprovação, faço a edição e o redeploy da função.
