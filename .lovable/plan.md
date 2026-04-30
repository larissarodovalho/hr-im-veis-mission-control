## Diagnóstico

A aba WhatsApp está carregando, mas aparece sem conversas porque a tabela `whatsapp_conversations` está vazia. O problema principal não é visual: as mensagens do provedor de WhatsApp não estão entrando no sistema.

Nos logs da função `whatsapp-webhook`, a chamada recebida está sendo recusada com:

```text
invalid_secret. provided=(empty) ... url=.../whatsapp-webhook?secret=
```

Ou seja: o webhook está chegando sem o token secreto. Como a função rejeita a chamada antes de salvar a conversa, a aba fica vazia e a Sofia não recebe nem responde.

Também encontrei dois pontos que precisam ser corrigidos para a aba ficar mais confiável:

- A tela de Configurações mostra a URL do webhook sem o `?secret=...`, o que induz à configuração errada no Evolution/Z-API.
- A aba WhatsApp não mostra erro/estado de diagnóstico quando não há conversas; ela só mostra “Nenhuma conversa ainda”, sem orientar que o webhook pode estar bloqueado.

## Plano de correção

### 1. Corrigir autenticação do webhook do WhatsApp

Atualizar `supabase/functions/whatsapp-webhook/index.ts` para:

- aceitar o segredo via `?secret=...` e também por headers comuns (`x-webhook-secret`, `x-evolution-secret`, `client-token`, `apikey`);
- tolerar casos em que o segredo salvo no backend esteja por engano como URL completa do webhook, extraindo o valor real de `secret` quando existir;
- responder de forma mais clara quando vier health-check vazio do provedor;
- manter proteção contra chamadas não autorizadas, sem abrir o webhook publicamente sem validação.

### 2. Atualizar a tela de Configurações

Atualizar `src/pages/ConfiguracoesPage.tsx` para deixar explícito que o webhook precisa ser configurado com segredo:

```text
https://.../functions/v1/whatsapp-webhook?secret=SEU_TOKEN
```

E adicionar uma instrução curta dizendo que no Evolution/Z-API o evento precisa apontar para `messages.upsert`/mensagens recebidas.

### 3. Melhorar a aba WhatsApp

Atualizar `src/pages/WhatsApp.tsx` para:

- mostrar um estado vazio mais útil, explicando que se não aparecem conversas é provável que o webhook ainda não esteja recebendo mensagens;
- adicionar um botão/atalho para Configurações;
- exibir erro de carregamento se a consulta falhar, em vez de parecer que está tudo certo;
- manter atualização em tempo real quando novas conversas chegarem.

### 4. Corrigir inconsistência de payload no envio manual

Revisar o envio pela aba WhatsApp e pela tela de teste para garantir que `whatsapp-send` receba sempre `content` e telefone/conversa no formato esperado.

### 5. Testar após o ajuste

Depois de implementar, vou testar:

- leitura da aba WhatsApp;
- chamada do webhook com payload de mensagem simulada e segredo válido;
- criação de conversa/mensagem no banco;
- resposta automática da Sofia quando `ai_enabled = true`;
- envio manual pela aba WhatsApp.

## Observação importante

Depois do código corrigido, ainda será necessário garantir que o webhook no painel Evolution/Z-API esteja usando a URL com `?secret=SEU_TOKEN`. Se ele continuar chamando com `?secret=` vazio, nenhuma aplicação consegue receber as mensagens com segurança.