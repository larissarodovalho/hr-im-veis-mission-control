## Objetivo
Trocar os segredos `GOOGLE_OAUTH_CLIENT_ID` e `GOOGLE_OAUTH_CLIENT_SECRET` pelos valores recém-criados no Google Cloud Console e confirmar que o fluxo de conexão com o Google Calendar funciona.

## Passos
1. Abrir o formulário seguro para você colar:
   - `GOOGLE_OAUTH_CLIENT_ID` — o valor que termina em `.apps.googleusercontent.com`
   - `GOOGLE_OAUTH_CLIENT_SECRET` — o valor que começa com `GOCSPX-`
2. Testar a edge function `google-oauth-start` com `curl` para confirmar que ela retorna agora uma URL de autorização válida (sem `setupRequired`).
3. Pedir pra você clicar em "Conectar Google Calendar" em `/crm/minha-conta` e validar pelos logs da edge function `google-oauth-callback` que o callback completa com sucesso.

## Observação
Nenhuma mudança de código é necessária — só atualização dos segredos.
