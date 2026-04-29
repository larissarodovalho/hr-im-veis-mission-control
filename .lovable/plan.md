## Diagnóstico confirmado

Olhei agora o log mais recente da função `whatsapp-webhook`:

```
[whatsapp-webhook] invalid_secret.
provided=crm…(12)            ← Evolution mandou "crmhrimoveis" (correto)
expected_prefix=htt…(101)    ← secret salvo no Cloud é a URL inteira (errado)
```

Ou seja: a Evolution está mandando o valor certo (`crmhrimoveis`), mas o secret `WHATSAPP_WEBHOOK_SECRET` no Lovable Cloud foi salvo como `https://pbqiwdwwabvjmybbatdv.supabase.co/functions/v1/whatsapp-webhook?secret=crmhrimoveis` (a URL inteira, 101 caracteres) em vez de só `crmhrimoveis`.

A causa é fora do código — está no painel de Secrets. Eu não consigo editar o valor de um secret existente diretamente, então preciso fazer assim:

## O que vou fazer ao aprovar

1. **Pedir o secret de novo** via tool `add_secret`, com nome `WHATSAPP_WEBHOOK_SECRET` e instrução clara para você digitar **apenas** `crmhrimoveis` (sem URL, sem `?`, sem `=`, sem espaços). Isso vai sobrescrever o valor errado atual.

2. **Não vou alterar nenhum código** — a função já está pronta e validando corretamente. O `index.ts` aceita o secret via `?secret=`, header `apikey`, `x-webhook-secret`, `x-evolution-secret` ou `client-token`, então qualquer formato que a Evolution use já funciona.

3. **Validar imediatamente após você salvar**:
   - Você manda uma mensagem do seu celular pra Sofia.
   - Eu consulto os logs da função `whatsapp-webhook` esperando ver `200 OK` no lugar de `invalid_secret`.
   - Eu consulto `whatsapp_messages` filtrando `direction='inbound'` pra confirmar que a mensagem foi salva.
   - Confirmo que a Sofia (IA) respondeu automaticamente.

4. **Se ainda falhar**, eu olho o novo log com o `provided=...` e o `expected_prefix=...` pra ver onde divergiram, e ajusto.

## Detalhes técnicos

- Arquivo `supabase/functions/whatsapp-webhook/index.ts` linhas 279-304 já fazem validação correta com fallback em múltiplos headers + query param.
- Nenhum schema, RLS, frontend ou edge function precisa mudar.
- A URL do webhook na Evolution continua igual: `https://pbqiwdwwabvjmybbatdv.supabase.co/functions/v1/whatsapp-webhook?secret=crmhrimoveis` — não mexa nela.

## Resumo curtinho

O código está certo. O secret está errado. Aprova que eu disparo o pedido pra você redigitar **só** `crmhrimoveis` no campo, e na sequência testamos junto.