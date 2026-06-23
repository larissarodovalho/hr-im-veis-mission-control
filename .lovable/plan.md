## Mostrar corretor responsável nos cards do Kanban de Leads

No componente do Kanban em `src/pages/Leads.tsx`, cada card mostra nome, região, origem, temperatura e follow-up — mas não exibe quem é o corretor responsável.

### Mudanças

1. **Buscar nomes dos corretores** uma vez no `Leads.tsx`: query em `profiles` (`user_id`, `nome`) montando um mapa `{ user_id → nome }`.
2. **Propagar o mapa** até `LeadCard` via props (Board → Column → LeadCard).
3. **Adicionar etiqueta no card** (badge pequena, mesma linha das outras) com ícone de usuário + primeiro/último nome do corretor (`lead.corretor_id`). Se não houver responsável, mostrar badge "Sem responsável" em estilo `outline` discreto.

### Detalhes técnicos

- Badge usa `variant="secondary"` com `text-[10px]`, ícone `User` do `lucide-react`, mesmo padrão visual das demais badges do card (linha 270–275).
- O mapa é carregado uma vez no mount do `Leads` (sem realtime — basta refazer se necessário).
- Sem mudanças de RLS nem de schema: `profiles` já é legível pela equipe.
- Nenhuma alteração na visualização "lista" (que já tem coluna de corretor, se aplicável) — só no Kanban.