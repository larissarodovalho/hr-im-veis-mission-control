## Tornar o diálogo "Novo compromisso" rolável

### Problema
O diálogo "Novo compromisso" agora tem muitos campos (tipo, duração, título, data, lead, conta, imóvel, local/link, notas, recorrência). Em telas menores, a parte de cima (cabeçalho) e a de baixo (botões Cancelar/Agendar) ficam cortadas porque o `DialogContent` não rola — todo o conteúdo cresce além da viewport.

### Mudança
Em `src/pages/Schedule.tsx`, no `<DialogContent>` do "Novo compromisso":

- Adicionar `className="max-w-lg max-h-[90vh] flex flex-col p-0"`.
- Envolver o `<form>` em um wrapper com:
  - Header fixo (`DialogHeader` com padding próprio, `shrink-0`).
  - Corpo do formulário em um `<div className="overflow-y-auto px-6 py-4 flex-1 min-h-0">` contendo todos os campos.
  - `DialogFooter` fixo no rodapé (`shrink-0 px-6 py-4 border-t`).
- Manter o `<form>` em volta de tudo para que o submit continue funcionando; o footer fica dentro do form.

Aplicar o mesmo padrão ao diálogo "Editar compromisso" para consistência (também ficou alto).

### Arquivos
- `src/pages/Schedule.tsx` — ajuste de layout dos dois diálogos (novo e editar). Sem mudança de lógica.
