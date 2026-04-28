## Objetivo
Igualar o fluxo de "Novo lead" da aba Leads ao do projeto Brazil Lands. A página Leads em si (kanban, lista, filtros, badges 📅/⏱️, "Precisam nutrição", drag-and-drop, exclusão) já está em paridade. A diferença está no diálogo de criação e no tratamento de duplicatas.

## Mudanças em `src/pages/Leads.tsx`

### Imports
- Adicionar `AlertTriangle` em `lucide-react`.
- Adicionar `useNavigate` em `react-router-dom`.
- Remover `DuplicateAlert` (não será mais usado nesse arquivo).

### Refatorar `NewLeadDialog`
Substituir a lógica atual (que faz check inline em `useEffect` e usa `<DuplicateAlert>` dentro do mesmo formulário) pelo fluxo do Brazil Lands:

1. **Submit** → valida nome/sessão, monta payload, chama `findDuplicates({ email, telefone })` filtrando só `table === "leads"`.
2. Se houver duplicatas → guarda `pendingPayload` e abre **diálogo dedicado** "Lead já existe" (ícone `AlertTriangle`, cor warning).
3. Diálogo de duplicatas mostra cada match com:
   - Nome, telefone, email
   - Linha "Coincide por: <campos>" em amber
   - **Botão "Abrir existente"** → fecha o diálogo, reseta o form e navega para `/app/leads/{id}`.
   - **Botão "Atualizar e mover p/ Prospecção"** → preenche campos vazios do lead existente (nome só substitui se for placeholder tipo "WhatsApp ..." ou "Lead sem nome"), concatena observações, define `ultima_interacao = now()` e `etapa_funil = "Prospecção"`.
   - Rodapé: "Cancelar" e **"Criar novo mesmo assim"** → insere o `pendingPayload` mesmo havendo duplicata.
4. Sem duplicatas → cria diretamente.
5. Após criar/atualizar: toast de sucesso, fecha diálogo, reseta form, dispara `onCreated()`.

Estrutura do componente passa a retornar um Fragment com dois `<Dialog>`: o de criação e o de duplicatas.

## Fora de escopo
- Edge function `notify-new-lead` (existe no Brazil Lands, não há equivalente aqui).
- Mudanças no kanban, lista, filtros ou badges — já estão em paridade.
- Mudanças no schema do banco.

Aprove para eu implementar.