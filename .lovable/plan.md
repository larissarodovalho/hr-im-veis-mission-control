## Adicionar botão de editar tarefa

Adicionar ação de edição (ícone de lápis) em cada item de tarefa, reutilizando o mesmo dialog usado para criação.

### Arquivos

**`src/pages/Tasks.tsx`** (aba Tarefas)
- Adicionar estado `editingId` e função `editar(t)` que preenche `form` com os dados da tarefa e abre o dialog.
- Botão `Pencil` ao lado do `Trash2` em cada item (visível para admin ou criador).
- `salvar()` passa a fazer `update` quando `editingId` está setado, senão `insert` (comportamento atual).
- Título do Dialog muda entre "Nova tarefa" / "Editar tarefa"; botão muda para "Salvar alterações".
- Resetar `editingId` ao fechar o dialog.

**`src/components/contas/ContaTarefas.tsx`** (aba do contato/conta)
- Mesma lógica: `editingId`, função `editar`, botão `Pencil` em `renderItem`, `salvar()` faz insert ou update conforme o caso, título e botão dinâmicos.

### Permissão
Mesma regra já usada para excluir: `isAdmin || t.created_by === userId`.
