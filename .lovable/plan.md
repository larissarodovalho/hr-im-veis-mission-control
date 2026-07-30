## Adicionar "Oportunidades" ao menu lateral do CRM

### Causa confirmada
As rotas `/crm/*` usam o layout `src/components/AppLayout.tsx`, cuja lista de navegação (`baseNav`) não inclui Oportunidades — por isso o item não aparece na barra lateral, mesmo a página `/crm/oportunidades` existindo e funcionando.

### Mudanças

1. **`src/hooks/useMenuAccess.tsx`**
   - Adicionar `"oportunidades"` ao tipo `MenuKey`.
   - Adicionar `{ key: "oportunidades", label: "Oportunidades", group: "CRM" }` em `MENU_ITEMS` — isso faz o toggle aparecer automaticamente na tela de Permissões do usuário.
   - Em `defaultForRole`: marketing-only também passa a ver Oportunidades por padrão (admin/gestor e corretores já caem na regra geral que libera; secretaria continua sem acesso).

2. **`src/components/AppLayout.tsx`**
   - Importar o ícone `HandCoins` (lucide).
   - Adicionar em `baseNav`, logo após "Contas": `{ to: "/crm/oportunidades", icon: HandCoins, label: "Oportunidades", key: "oportunidades" }` — seguindo a ordem do funil: Leads → Contas → Oportunidades.

3. **`src/App.tsx`**
   - Envolver a rota `oportunidades` com `<MarketingRoute menuKey="oportunidades">`, igual às demais rotas do CRM, para que o toggle de Permissões também valha no acesso direto pela URL.

### Resultado
- "Oportunidades" aparece na barra lateral entre Contas e Imóveis para admin, gestor, marketing e corretores.
- Admin pode ligar/desligar o acesso por usuário em Usuários → Permissões.

### Enquanto isso (acesso imediato)
Você já pode acessar pela aba **Imóveis → Oportunidades de Negócio → botão "Abrir Oportunidades de Negócio"**, ou direto pela URL `/crm/oportunidades`.