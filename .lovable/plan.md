## Problema

No Kanban (visualização padrão da página Leads), os botões **Follow-up IA** e **Follow-up Manual** já estão sendo renderizados dentro de cada card, mas:

1. Ficam escondidos no rodapé do card, abaixo de várias badges — visualmente passam despercebidos.
2. O botão **IA** aparece esmaecido (`opacity-60`) quando o lead tem menos de 72h sem interação, então parece "desligado" / inexistente.
3. Não há rótulo/separador indicando que aquela área é de "Follow-up".

Por isso a sensação de que "não apareceu nada" no Kanban.

## Plano

Tornar os botões de follow-up visíveis e claros em **todos os cards do Kanban**, sem mexer na lógica já existente (envio IA + registro manual continuam iguais).

### Ajustes em `src/components/contas/...` — não, apenas em `src/pages/Leads.tsx`

1. **Reorganizar o rodapé do `LeadCard` (Kanban)**:
   - Adicionar um separador fino (`border-t`) acima da área de follow-up.
   - Colocar um mini-rótulo "Follow-up" à esquerda dos botões para deixar claro o propósito.
   - Aumentar levemente o tamanho dos botões (`h-8`, ícone `h-3.5`) para serem mais clicáveis e visíveis.

2. **Sempre mostrar o botão IA, com estado claro**:
   - Quando elegível (72h+ sem interação, fora de Fechado/Perdido, com telefone): destaque com cor primária + ícone Sparkles.
   - Quando não elegível: manter visível mas com tooltip explicando "Disponível após 72h sem interação" e visual neutro (não esmaecido a ponto de sumir).

3. **Garantir que o clique nos botões não dispare drag-and-drop**:
   - Já há `onPointerDown={e => e.stopPropagation()}` no wrapper, mas vou reforçar adicionando também nos próprios botões para evitar qualquer conflito com `useDraggable`.

4. **Lista (tabela desktop)**: nenhuma mudança — coluna "Follow-up" já existe e funciona.

5. **Mobile cards**: nenhuma mudança — já mostra abaixo das badges.

### Resultado esperado

- No Kanban, cada card terá uma faixa clara no rodapé com "Follow-up: [✨ IA] [📋 Manual]".
- Botão IA fica destacado quando o lead realmente precisa (72h+).
- Clicar nos botões não inicia drag.
