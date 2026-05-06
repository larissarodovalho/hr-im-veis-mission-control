## Corrigir truncamento da mensagem da Sofia

A primeira mensagem está sendo cortada ("...pode me dizer seu nome e" — falta "sobrenome?"). Causa: a função `sanitizeReply` em `supabase/functions/whatsapp-webhook/index.ts` (linha 161) tem uma regex que remove qualquer palavra de 8+ caracteres terminada em `?`, pensando que era um token vazado. Isso apaga palavras normais como `sobrenome?`.

### Alteração

Em `supabase/functions/whatsapp-webhook/index.ts`, linha 161, restringir a regex para só remover strings que pareçam realmente um ID (precisa conter dígito, `_` ou `-`), mantendo intactas palavras normais do português:

```ts
.replace(/(^|\s)[A-Za-z0-9_-]{8,}\?(\s|$)/g, (m, pre, post) =>
  /[0-9_-]/.test(m) ? `${pre}${post}` : m)
```

### Deploy

Redeploy de `whatsapp-webhook`.
