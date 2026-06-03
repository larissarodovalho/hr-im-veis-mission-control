Recomeçar do zero, do Passo 1.

1. Abro o formulário seguro do Lovable para você colar o token atual do Passo 1 (User Token de curta duração do Graph API Explorer). Substitui o segredo `META_PAGE_ACCESS_TOKEN`.
2. Rodo `meta-test-token` só pra confirmar que o token chegou no backend (vai aparecer como `type: USER`, isso é esperado nesse passo).
3. Passo 2 — trocar por User Token de longa duração (~60 dias): te passo a URL pronta com `grant_type=fb_exchange_token` usando seu App ID e App Secret. Você cola no navegador, copia o `access_token` da resposta, e eu reabro o formulário pra substituir.
4. Passo 3 — obter o Page Token permanente da HR Imóveis: chama `/me/accounts` com o token longo, copia o `access_token` do objeto cujo `name` é HR Imóveis, eu reabro o formulário, substitui e rodo `meta-test-token` + `meta-debug-subscription` pra confirmar `type: PAGE`, `name: HR Imóveis`, `Expires: Never` e webhook inscrito.