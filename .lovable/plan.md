## Recriar chave HMAC do webhook Clicksign

Vamos regenerar o segredo HMAC que valida os webhooks que a Clicksign envia para nossa edge function `clicksign-webhook`.

### Passos

1. **Gerar novo segredo na Clicksign**
   - Painel Clicksign (production): https://app.clicksign.com → **Configurações da conta → API → Webhooks**
   - Edite (ou crie) o webhook que aponta para nossa URL:
     `https://pbqiwdwwabvjmybbatdv.supabase.co/functions/v1/clicksign-webhook`
   - Gere/copie o **Secret HMAC** (string usada para assinar `Content-Hmac: sha256=...`)
   - Salve na Clicksign

2. **Atualizar o secret no Lovable Cloud**
   - Vou abrir a tela para você colar o novo valor em `CLICKSIGN_HMAC_SECRET`
   - Cole **sem aspas, sem espaços**, exatamente como veio da Clicksign

3. **Redeploy automático** da função `clicksign-webhook` para garantir que o novo valor seja lido

4. **Validação**
   - Você dispara um evento na Clicksign (ex.: enviar/cancelar um documento de teste)
   - Eu verifico os logs de `clicksign-webhook` para confirmar que a verificação HMAC passou (sem `403 invalid signature`)

### Observação

Nenhuma alteração de código é necessária — a função `verifyClicksignHmac` em `supabase/functions/_shared/clicksign.ts` já lê `CLICKSIGN_HMAC_SECRET` do ambiente e valida `Content-Hmac: sha256=...` com timing-safe compare.