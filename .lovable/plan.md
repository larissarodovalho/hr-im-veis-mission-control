Tornar os três cards do Dashboard ("Reuniões", "Ligações (30d)" e "Visitas (4 semanas)") clicáveis, navegando para as páginas de listagem já existentes.

## Mudanças em `src/pages/Dashboard.tsx`

1. Importar `useNavigate` de `react-router-dom`.
2. Envolver cada um dos três `<Card>` (linhas 150, 170, 188) com `onClick` + classes `cursor-pointer hover:shadow-md transition-shadow`:
   - Reuniões → `navigate("/crm/reunioes")`
   - Ligações → `navigate("/crm/ligacoes")`
   - Visitas → `navigate("/crm/visitas")`
3. Adicionar `role="button"` e `tabIndex={0}` + handler `onKeyDown` para acessibilidade (Enter/Space).

As rotas `/crm/reunioes`, `/crm/ligacoes` e `/crm/visitas` já existem em `src/App.tsx` (componentes `Meetings`, `Calls`, `Visits`) e exibem a relação completa.

Observação: hoje a barra lateral do CRM mostra apenas "Visitas" entre essas três. Se quiser que "Reuniões" e "Ligações" também apareçam como itens da sidebar para ficarem totalmente sincronizadas, posso adicioná-las em seguida — confirme se deseja.