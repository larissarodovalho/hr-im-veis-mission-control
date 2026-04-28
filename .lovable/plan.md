## Reconfigurar chaves do Clicksign

O token salvo (36 caracteres) está sendo recusado pela Clicksign no ambiente de produção (`app.clicksign.com`). Vamos pedir novamente as duas chaves para garantir que estão corretas e consistentes entre si.

### O que farei

1. Disparar a solicitação para você atualizar dois secrets:
   - **`CLICKSIGN_API_TOKEN`** — token da API Clicksign
   - **`CLICKSIGN_ENV`** — `production` ou `sandbox`

2. Após você salvar, redeploy automático das edge functions que usam o cliente compartilhado:
   - `clicksign-create-document`
   - `clicksign-cancel-document`
   - `clicksign-download-signed`
   - `clicksign-resend-notification`

3. Você testa reenviando um documento. Se ainda falhar, a mensagem de erro já mostra o ambiente alvo e o tamanho do token, facilitando diagnosticar.

### Como obter o token correto na Clicksign

1. Acesse o painel Clicksign **no mesmo ambiente** que vai usar:
   - Produção: https://app.clicksign.com
   - Sandbox: https://sandbox.clicksign.com
2. Vá em **Configurações da conta → API**.
3. Copie o **Access Token** (Token de API). É uma string única — cole **sem aspas, sem "Bearer", sem rótulo**.

### Regra crítica

`CLICKSIGN_ENV` e `CLICKSIGN_API_TOKEN` devem ser do **mesmo ambiente**:
- Token gerado em `app.clicksign.com` → `CLICKSIGN_ENV=production`
- Token gerado em `sandbox.clicksign.com` → `CLICKSIGN_ENV=sandbox`

Tokens de sandbox **não funcionam** em produção e vice-versa — esse é o motivo mais provável do 403 atual.

### Nenhuma alteração de código necessária

A normalização de token e ambiente já está no lugar (`supabase/functions/_shared/clicksign.ts`). Só precisamos atualizar os secrets.