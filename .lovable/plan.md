## Correção de links da navegação lateral e autenticação

### Problema identificado
A navegação lateral (sidebar) do CRM já aponta corretamente para `/crm` e suas subpáginas (`/crm/leads`, `/crm/contas`, etc.).

No entanto, existe uma referência residual a `/app` no fluxo de autenticação com Google que precisa ser corrigida:

- **`src/pages/Auth.tsx` (linha 37)** — O `redirectTo` do OAuth do Google ainda aponta para `/app`. Após login, o usuário cai em um redirect extra em vez de ir direto para `/crm`.

### O que será feito
1. Atualizar o `redirectTo` do Google OAuth em `src/pages/Auth.tsx` de `/app` para `/crm`.
2. Verificar rapidamente se existem outras referências a `/app` em links de navegação, botões ou redirecionamentos que possam ter sido perdidos na migração anterior.

### Resultado esperado
- Login com Google redireciona diretamente para `/crm`
- Nenhuma referência a `/app` permanece em links de navegação ou fluxos de autenticação
