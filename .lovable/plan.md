Vamos refazer a vinculação usando um novo token da página correta.

Plano:
1. Abrir o formulário seguro do Lovable para substituir o segredo `META_PAGE_ACCESS_TOKEN`.
2. Você cola ali o novo token gerado para a página correta.
3. Depois da substituição, validar o token pelo backend com `meta-test-token`.
4. Confirmar que o token está como:
   - Tipo: Page
   - Perfil/Página: HR Imóveis
   - Expiração: Never
5. Rodar a checagem da inscrição/webhook com `meta-debug-subscription` para confirmar que a integração ficou apontando para a página certa.

Importante: antes de colar, o token precisa ser o `access_token` do objeto da página HR Imóveis vindo de `/me/accounts`, não o token de usuário do Graph Explorer.