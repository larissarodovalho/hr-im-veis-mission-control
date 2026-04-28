## Objetivo

Ativar a integração com o Clicksign (já implementada no código) cadastrando as duas chaves necessárias e validando que tudo funciona ponta a ponta: envio, assinatura, webhook e download.

## O que vai acontecer ao aprovar

### 1. Solicitar as duas chaves
Abro um formulário seguro pedindo:

- **CLICKSIGN_API_TOKEN** — token de acesso à API (Configurações → API → Access Token no painel Clicksign).
- **CLICKSIGN_HMAC_SECRET** — segredo do webhook (Configurações → API → Webhooks no painel Clicksign).

Recomendado começar com o ambiente **Sandbox** do Clicksign para testar sem custo. Quando estiver tudo ok, troca pelas chaves de produção.

### 2. Configurar o webhook no Clicksign
No painel do Clicksign, em Configurações → API → Webhooks, você cola:

```
https://pbqiwdwwabvjmybbatdv.supabase.co/functions/v1/clicksign-webhook
```

Eventos a marcar: `auto_close`, `sign`, `add_signer`, `cancel`, `deadline`, `refusal`.

### 3. Verificações automáticas
Depois de salvar as chaves, eu:

- Confirmo que os secrets foram registrados.
- Verifico os logs das edge functions (`clicksign-create-document` e `clicksign-webhook`) para garantir que não há erro de configuração.
- Faço um teste de envio de documento simples pela tela `/app/documentos` para validar o fluxo.

### 4. Pequenos ajustes se necessário
Se algum log apontar problema (ex.: header errado, validação HMAC, lockfile da edge function), eu corrijo na hora.

## Detalhes técnicos

- As chaves ficam armazenadas como secrets do backend e só são lidas pelas edge functions Clicksign (`clicksign-create-document`, `clicksign-webhook`, `clicksign-resend-notification`, `clicksign-cancel-document`, `clicksign-download-signed`).
- A função `clicksign-webhook` valida a assinatura HMAC SHA-256 de cada notificação recebida, garantindo que só o Clicksign consegue atualizar o status dos documentos.
- A função `clicksign-create-document` faz upload do PDF para o bucket privado `signed-documents`, cria o documento no Clicksign e adiciona os signatários.
- Realtime já está habilitado em `signed_documents`, `document_signers` e `document_events`, então a UI atualiza sozinha conforme o webhook chega.

## Pré-requisitos do seu lado

- Conta no Clicksign com plano que libere a API (Sandbox é gratuito).
- Acesso ao painel Clicksign para gerar Access Token e configurar Webhook.

Posso prosseguir?