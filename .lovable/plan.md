## Permitir que corretores editem tarefas

Hoje o botão de editar (e excluir) só aparece para `isAdmin || t.created_by === userId`. O usuário quer que qualquer corretor possa editar tarefas.

### Mudanças

**`src/pages/Tasks.tsx`**
- Remover a condição `(isAdmin || t.created_by === userId)` ao redor do botão `Pencil`, mostrando-o sempre.
- Manter o botão `Trash2` restrito a admin/criador (excluir continua sensível).
- Separar os dois botões em condicionais distintas.

**`src/components/contas/ContaTarefas.tsx`**
- Mesma alteração: `Pencil` sempre visível, `Trash2` permanece restrito.

### Permissões no banco
Verificar se as policies de UPDATE na tabela `tarefas` já permitem a qualquer staff/corretor atualizar. Se estiverem restritas a criador/admin, criar migration ajustando a policy para `is_staff()` (ou equivalente) no UPDATE. Caso contrário, apenas a mudança de UI basta.
