Plano:

1. Atualizar o menu lateral principal em `src/components/AppLayout.tsx`
   - Importar um ícone de tarefas do `lucide-react`, como `ListTodo` ou `CheckCircle2`.
   - Adicionar o item `Tarefas` no array `baseNav`, apontando para `/crm/tarefas`.
   - Posicionar a aba perto de `Agenda`, já que ela representa atividades futuras.

2. Manter a rota existente
   - A rota `/crm/tarefas` já existe em `src/App.tsx` e já carrega a página `Tasks`, então não será necessário mexer em banco de dados nem nas regras de acesso.

3. Resultado esperado
   - A aba `Tarefas` aparecerá na barra lateral mostrada na imagem.
   - Ao clicar nela, o usuário será levado para a tela centralizada de tarefas futuras.