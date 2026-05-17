## Objetivo
Substituir os Selects fixos de **Lead** e **Conta** (nos diálogos "Nova reunião" e "Editar reunião") por um **combobox com busca por digitação**, filtrando os itens carregados do banco conforme o usuário digita.

## Mudanças em `src/pages/Meetings.tsx`

1. Criar componente local `SearchableSelect` (ou usar `Command` + `Popover` do shadcn já presentes no projeto) com:
   - Input de texto para digitar/filtrar
   - Lista filtrada por `nome` (case-insensitive, contains)
   - Opção "Sem vínculo" no topo
   - Mostra o nome selecionado quando fechado

2. Usar esse combobox para os 4 campos:
   - Lead (Nova reunião)
   - Conta (Nova reunião)
   - Lead (Editar reunião)
   - Conta (Editar reunião)

3. Continuar usando as listas `leads` e `contas` já carregadas no `useEffect` (filtragem client-side — já vêm ordenadas por nome). Sem mudança no backend.

## Observações
- Implementação puramente de UI, sem alteração de schema ou lógica de persistência.
- Componentes `Command`, `Popover` e o ícone `Check`/`ChevronsUpDown` (lucide) já disponíveis.
