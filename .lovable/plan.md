## Diagnóstico

A Sofia não caiu — ela travou num loop. Olhei a conversa da Larissa (20:48–20:52):

```
Sofia: como você prefere falar… videochamada, presencial, ligação ou WhatsApp?
Lead:  "queria falar com ele agora"
Sofia: "Qual das três fica melhor: videochamada, presencial ou ligação?"
Lead:  "agora"
Sofia: "Entendi, mas para agendar o contato, preciso que você escolha uma das opções."
Lead:  (parou de responder)
```

O prompt obriga a sequência forma → urgência. Quando o lead expressa urgência antes de escolher a forma, a Sofia ignora o sinal e fica cobrando a forma. Como o lead já tinha dito "agora" duas vezes e a Sofia continuou pedindo opção, ela desistiu.

Não há mensagens inbound bloqueadas — o único 401 nos logs é um health-check da Evolution com `?secret=` vazio, não mensagem real.

## Mudanças

### 1. Atualizar `AI_SYSTEM` em `supabase/functions/whatsapp-webhook/index.ts`

Adicionar regra explícita pra urgência detectada cedo:

- Se o lead disser "agora", "urgente", "agora mesmo", "quero falar já", etc. **antes** de escolher a forma de contato → Sofia deve perguntar UMA vez: "Show, vou avisar o Hans! Pra ele te chamar, prefere por videochamada, ligação, presencial ou WhatsApp?" e em seguida chamar `request_immediate_contact` com a forma escolhida.
- Se a forma de contato JÁ foi mencionada na mesma mensagem ("ligação agora", "WhatsApp agora") → chamar `request_immediate_contact` direto, sem perguntar de novo.
- Reforçar: nunca repetir 3x a mesma pergunta. Após 2 tentativas sem clareza, escolher um default razoável (WhatsApp) e seguir.

### 2. Adicionar fallback no handler `request_immediate_contact`

Se o LLM eventualmente chamar a tool sem `kind` ou com `kind` inválido, default para `whatsapp` em vez de erro silencioso.

### 3. (Opcional, recomendado) Recuperar a Larissa

A conversa `3b54aaf1-...` está parada. Posso disparar manualmente o `notify-immediate-contact` pra essa lead — ela já demonstrou intenção urgente clara — e marcar a tag `urgente` + etapa "Contato Imediato" no CRM.

## Arquivos editados

- `supabase/functions/whatsapp-webhook/index.ts` — prompt + handler defensivo

## Verificação após deploy

- Testar fluxo: "oi" → nome → "comprar" → "quero falar agora" → Sofia pergunta forma 1x → "ligação" → tool chamada, email disparado, lead marcado.
- Conferir nos logs da function que `request_immediate_contact` é invocada.
