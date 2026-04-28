## Adicionar os três secrets do Clicksign

Vou disparar a tela segura para você colar os valores dos três secrets:

1. **`CLICKSIGN_API_TOKEN`** — Access Token da API (painel Clicksign → Configurações → API)
2. **`CLICKSIGN_ENV`** — `production` ou `sandbox`
3. **`CLICKSIGN_HMAC_SECRET`** — Secret do webhook (painel Clicksign → Configurações → API → Webhooks)

### Após você salvar

- Redeploy automático das edge functions afetadas:
  - `clicksign-create-document`
  - `clicksign-cancel-document`
  - `clicksign-download-signed`
  - `clicksign-resend-notification`
  - `clicksign-webhook`
- Você testa enviando um documento e/ou disparando um evento de webhook.
- Eu verifico os logs para confirmar que tudo passou.

Nenhuma alteração de código é necessária.