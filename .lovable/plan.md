## Objetivo
Diferenciar visualmente o badge do **Responsável** em cada card do Kanban de Contas, atribuindo uma cor única e consistente por pessoa.

## Mudança
Em `src/components/contas/ContasKanban.tsx`:
- Criar helper `ownerColor(userId)` que faz hash determinístico do `responsavel_id` e seleciona uma classe Tailwind de uma paleta com ~10 variações (bg + text + border em tons suaves, ex.: indigo, emerald, rose, amber, sky, violet, teal, fuchsia, lime, orange).
- Aplicar a classe retornada no `<Badge>` do responsável (substituindo o fixo `bg-indigo-500/15 text-indigo-700 border-indigo-500/30`).
- Mesmo usuário sempre recebe a mesma cor em qualquer card.

## Fora de escopo
- Não alterar cores de outros badges (temperatura, interesse, parceiro).
- Não alterar a lista/tabela — só o Kanban.
