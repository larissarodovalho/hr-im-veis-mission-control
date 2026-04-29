## Diagnóstico

Mensagens **outbound** (CRM → cliente) funcionam — chegam no WhatsApp.
Mensagens **inbound** (cliente → CRM) **não chegam**. Confirmado:

- Banco: 0 mensagens com `direction = 'inbound'` em `whatsapp_messages`.
- Logs da função `whatsapp-webhook`: única chamada recente retornou **HTTP 401** com URL:
  ```
  POST /functions/v1/whatsapp-webhook?secret=SEU_WHATSAPP_WEBHOOK_SECRET
  ```

A Evolution API está configurada com a string literal `SEU_WHATSAPP_WEBHOOK_SECRET` ao invés do valor real do secret. O webhook então valida, não bate, e devolve 401 — descartando a mensagem do cliente.

## O que vou fazer

### 1. Tornar o webhook mais tolerante e diagnosticável
No `supabase/functions/whatsapp-webhook/index.ts`:
- Logar claramente quando o secret estiver ausente/errado (com prefixo do recebido vs esperado, sem vazar o valor inteiro) para facilitar debug.
- Aceitar o secret também via header `apikey` (padrão Evolution) além de query `?secret=` e header `x-webhook-secret`.
- Manter rejeição 401 quando errado, mas com payload JSON explicando "invalid_secret" para aparecer no log do Evolution.

### 2. Reconfigurar o webhook na Evolution (instruções para você)
A causa raiz está **fora do código**: na configuração do webhook da instância Evolution. Vou te passar o passo a passo (Evolution Manager ou via API) com a URL correta:

```
https://pbqiwdwwabvjmybbatdv.supabase.co/functions/v1/whatsapp-webhook?secret=<valor real do WHATSAPP_WEBHOOK_SECRET>
```

Eventos que precisam estar marcados: `MESSAGES_UPSERT` (e opcionalmente `MESSAGES_UPDATE` para status).

### 3. Validar
Após você reconfigurar:
- Você manda uma mensagem do seu celular para o número da instância.
- Eu consulto `whatsapp_messages` filtrando `direction = 'inbound'` e os logs da função para confirmar 200 OK.
- Sofia responde automaticamente (fluxo IA já está pronto).

## Detalhes técnicos

- Arquivo único alterado: `supabase/functions/whatsapp-webhook/index.ts` (apenas a parte de validação do secret + logs).
- Nenhuma mudança de schema, RLS ou frontend.
- O secret `WHATSAPP_WEBHOOK_SECRET` já existe no projeto — não precisa recriar.

## Pergunta antes de aplicar

Você tem acesso ao painel da Evolution API (Evolution Manager) para reconfigurar a URL do webhook da instância `Sofia-hr-imoveis`? Se sim, eu aplico a correção no código e te passo o passo a passo. Se não, podemos chamar a API da Evolution direto pelo backend para reconfigurar — me avise.
