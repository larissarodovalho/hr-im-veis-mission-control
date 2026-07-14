## Objetivo

Na aba **Contas → Carteira**, cada coluna do Kanban (A contatar, Contatado, Sem retorno, Contato estabelecido, Captação, Reunião, Visita, Proposta, Fechamento, Oportunidade futura, Parceiros) deve ter rolagem vertical independente — sem que a página inteira role junto.

## Diagnóstico

O componente `src/components/contas/ContasKanban.tsx` já tenta implementar isso com uma altura dinâmica por coluna (`h-[calc(100dvh - var(--kanban-top))]`). Porém o wrapper externo em `src/pages/Accounts.tsx` está dentro do fluxo normal da página, então:

- A página como um todo continua rolando junto com o cabeçalho, filtros e o próprio Kanban.
- Quando o usuário rola verticalmente, ele move o Kanban inteiro em vez das colunas.
- O cálculo `--kanban-top` só cobre o momento em que o wrapper aparece, não trava a área.

## Mudanças

Somente frontend / apresentação, apenas na Carteira/Marketing (rota `?lista=carteira` e `?lista=marketing`):

1. **`src/pages/Accounts.tsx`** — no bloco `view === "kanban" && lista !== "todos"`:
   - Envolver `<ContasKanban />` em um container com altura fixa relativa ao viewport (`h-[calc(100dvh-var(--kanban-top,260px))]`) e `overflow-hidden`, ancorando a área do Kanban.
   - Medir o topo do container e expor `--kanban-top` nele (via `ref` + `ResizeObserver`), tornando a medição estável independentemente do que estiver acima (filtros, tabs, tags).

2. **`src/components/contas/ContasKanban.tsx`**:
   - Trocar o cálculo de altura das colunas para preencher 100% do container pai (`h-full min-h-0` no wrapper flex; colunas com `flex-1 min-h-0` e a área de cards com `flex-1 overflow-y-auto`).
   - Remover a lógica atual de `--kanban-top` interna (passa a ser responsabilidade do container em `Accounts.tsx`).
   - Manter `overflow-x-auto` no eixo horizontal do wrapper para telas estreitas.

## Resultado esperado

- O topo da página (título, botões, tabs Carteira/Marketing, filtros) permanece fixo em relação ao Kanban.
- A área do Kanban ocupa o restante da viewport.
- Cada coluna rola verticalmente de forma independente.
- Sem alterações de lógica de negócio, dados ou RLS.
