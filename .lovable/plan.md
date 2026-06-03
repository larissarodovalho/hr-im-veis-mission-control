## Objetivo
Substituir o `META_PAGE_ACCESS_TOKEN` atual (que expirou em ~60 dias) por um **Page Access Token permanente**, para o webhook nunca mais parar de receber leads por token expirado.

## Como funciona (contexto)
Tokens da Meta têm 3 tipos:
1. **User Token curto** (~1h) — o que sai do Graph API Explorer.
2. **User Token longo** (~60 dias) — gerado trocando o curto pelo endpoint `oauth/access_token`.
3. **Page Token derivado de User Token longo** — **não expira** (desde que o usuário mantenha admin da Página e as permissões do app).

Vamos chegar no #3.

## Passos que você executa no painel da Meta

1. Abra https://developers.facebook.com/tools/explorer/
2. Selecione o App do CRM. Em "User or Page" deixe **User Token**.
3. Em Permissions adicione: `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`, `pages_manage_ads`, `leads_retrieval`, `business_management`.
4. Clique **Generate Access Token** e autorize. Copie o token (User Token curto).
5. Troque por User Token longo (cole no navegador, substituindo as chaves):
   ```
   https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={USER_TOKEN_CURTO}
   ```
   Copie o `access_token` da resposta (User Token longo, ~60 dias).
6. Liste as Páginas com esse token longo:
   ```
   https://graph.facebook.com/v21.0/me/accounts?access_token={USER_TOKEN_LONGO}
   ```
   Encontre a Página HR Imóveis e copie o campo `access_token` dela.
   **Esse é o Page Token permanente.**
7. (Opcional, mas recomendado) Confirme que não expira em https://developers.facebook.com/tools/debug/accesstoken/ → o campo "Expires" deve mostrar **Never**.

## Passo que eu executo (depois que você aprovar o plano)

1. Abrir o formulário seguro do Lovable para você colar o novo `META_PAGE_ACCESS_TOKEN` (substitui o atual).
2. Adicionar na aba **Configurações → Meta Lead Ads** um pequeno card **"Validade do token"** que chama `meta-test-token` + um endpoint `debug_token` da Meta e mostra:
   - Status (válido / expirado)
   - Data de expiração (ou "Nunca")
   - Página vinculada
   Assim, se algum dia for trocado por um token de curta duração de novo, você vê na hora.
3. Após salvar o token: clicar **"Testar conexão"** e enviar um lead pelo Lead Ads Testing Tool para confirmar fim a fim.

## Observações importantes
- O Page Token permanente continua válido enquanto o usuário que o gerou for admin da Página e o App mantiver as permissões aprovadas. Se aquele usuário sair da Página, o token morre — por isso o ideal a longo prazo é um **System User Token** do Business Manager (também não expira e independe de pessoa física). Posso incluir esse caminho alternativo no plano se preferir.
- Nada de código de negócio muda. Só o segredo e um indicador de validade na UI de Configurações.
