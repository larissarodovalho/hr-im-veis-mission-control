## Objetivo
Refazer a geração do Page Access Token permanente porque o token enviado anteriormente aponta para uma Página diferente da **HR Imóveis**.

## Causa provável
No Passo 1 (Graph API Explorer), ao clicar **Generate Access Token**, a tela de autorização do Facebook lista todas as Páginas que sua conta administra e por padrão **só vem marcada a primeira / a que você usou na última vez**. Se a HR Imóveis não estava marcada ali, o User Token longo não tem permissão sobre ela e o `/me/accounts` devolve outra Página (ou nenhuma).

A correção é repetir os Passos 1 → 3 garantindo que a HR Imóveis esteja explicitamente selecionada na tela de "Opt in to Pages".

## Passos que você executa

### Passo 1 — Gerar User Token curto com a Página certa
1. Abra https://developers.facebook.com/tools/explorer/
2. No topo direito, em **Meta App** selecione o App do CRM (mesmo de antes).
3. Em **User or Page** deixe **User Token**.
4. Em **Permissions** confirme estas (adicione as que faltarem):
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_metadata`
   - `pages_manage_ads`
   - `leads_retrieval`
   - `business_management`
5. Clique **Generate Access Token**.
6. **ATENÇÃO — passo onde deu errado da última vez:** Vai abrir um popup do Facebook pedindo autorização. Numa das telas vai aparecer **"Opt in to all current and future Pages"** ou **"Choose what [App] can access"** com uma lista de Páginas e um botão **"Edit access"** / **"Escolher o que pode acessar"**.
   - Clique **Edit access** / **Escolher**.
   - **Marque a Página HR Imóveis** (e pode marcar as outras também, não atrapalha).
   - Confirme.
7. Copie o token gerado (User Token curto, ~1h).

### Passo 2 — Trocar pelo User Token longo (~60 dias)
Cole na barra do navegador, substituindo `{APP_SECRET}` e `{USER_TOKEN_CURTO}`:
```
https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=1116308894903755&client_secret={APP_SECRET}&fb_exchange_token={USER_TOKEN_CURTO}
```
Copie o `access_token` da resposta.

### Passo 3 — Listar páginas e validar
```
https://graph.facebook.com/v21.0/me/accounts?access_token={USER_TOKEN_LONGO}
```
Confirme que **HR Imóveis aparece na lista**. Copie o `access_token` do objeto da HR Imóveis — esse é o Page Token permanente.

### Passo 4 — Validar que é permanente
Cole em https://developers.facebook.com/tools/debug/accesstoken/ → o campo **Expires** deve mostrar **Never** e o campo **Profile ID** deve ser o ID da Página HR Imóveis (não o seu User ID).

## Passos que eu executo depois
1. Abrir o formulário seguro do Lovable pra você colar o novo `META_PAGE_ACCESS_TOKEN` (substitui o atual).
2. Chamar a edge function `meta-test-token` que vai mostrar:
   - Nome da Página vinculada (precisa ser **HR Imóveis**)
   - `never_expires: true`
3. Chamar `meta-debug-subscription` pra confirmar que o app continua subscrito ao campo `leadgen` da Página.
4. Se algo estiver errado, te aviso antes de salvar.

## Se der errado de novo
Caso o popup de autorização **não mostre** a opção de escolher Páginas (alguns navegadores pulam essa tela quando já há autorização prévia salva), faça antes:
1. Vá em https://www.facebook.com/settings?tab=business_tools
2. Encontre o App do CRM → **Remover**.
3. Volte ao Graph API Explorer e refaça o Passo 1 — agora a tela de seleção de Páginas vai aparecer obrigatoriamente.

## Observação
Como você é admin direto da Página, o Page Token permanente vai funcionar enquanto sua conta continuar admin. Se um dia você quiser blindar contra "e se eu sair da Página", a alternativa definitiva é gerar via **System User do Business Manager** — posso documentar esse caminho num plano separado quando quiser.