## Fazer o botão "Voltar" do CRM voltar para a página anterior real

Hoje os botões Voltar em **AccountDetail** e **LeadDetail** são `<Link>` fixos (`/crm/contas` e `/crm/leads`), então sempre caem na lista — perdendo filtros, scroll e a aba do kanban em que o usuário estava. Quero usar o histórico do navegador.

### Mudanças

1. **`src/pages/AccountDetail.tsx`** — trocar o `<Link to="/crm/contas">` por um `<button>` (ou `Button variant="ghost"`) com `onClick={() => navigate(-1)}`. Importar `useNavigate` do `react-router-dom`.

2. **`src/pages/LeadDetail.tsx`** — mesma mudança: `<Link to="/crm/leads">` vira `navigate(-1)`.

### Fallback

Se o usuário abrir a URL diretamente (sem histórico interno — ex.: link do WhatsApp), `navigate(-1)` sai do app. Para evitar isso, uso este padrão:

```ts
const onBack = () => {
  if (window.history.length > 1) navigate(-1);
  else navigate("/crm/contas"); // ou /crm/leads
};
```

### Fora de escopo

- `DocumentDetail.tsx` já usa `navigate(-1)`.
- Botões "Voltar" do site público (`ImovelDetalhePage`) não fazem parte do CRM — não vou mexer.

Posso prosseguir?
