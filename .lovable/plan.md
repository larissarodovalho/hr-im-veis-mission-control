## Objetivo

Na página de detalhe da conta (`/app/contas/:id`), dentro do diálogo "Editar conta", adicionar um campo **Responsável** para escolher qual corretor é o responsável pela conta.

## Mudanças (arquivo único: `src/pages/AccountDetail.tsx`)

1. **Carregar a lista de corretores** ao montar a página:
   - Buscar de `profiles` (campos `user_id`, `nome`, `email`) onde `ativo = true`, ordenado por `nome`.
   - Guardar em `useState` (`corretores`).

2. **Adicionar `<Select>` "Responsável"** no diálogo de edição, logo após o bloco Status/Interesse:
   - Valor controlado por `editing.responsavel_id`.
   - Opções: lista de corretores carregada (label = `nome`, value = `user_id`).
   - Inclui opção "Sem responsável" (limpa o campo).

3. **Persistir no `save()`**: incluir `responsavel_id: editing.responsavel_id || null` no `update` da tabela `contas`.

4. **Exibir o responsável atual no cabeçalho** (acima do botão Editar): mostrar um pequeno texto "Responsável: {nome}" usando o mapa de corretores, para o usuário ver rapidamente quem é o responsável sem abrir o diálogo.

## Fora de escopo

- Banco de dados (coluna `responsavel_id` em `contas` já existe).
- Mudanças no Kanban, em "Carteira e Marketing", ou em outras telas.
- Permissões/RLS (políticas já permitem admin/gestor atualizar; corretor responsável continua vendo a conta).
