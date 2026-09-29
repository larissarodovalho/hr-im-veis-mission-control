# Contas: mostrar só corretores na lista de responsáveis

## Problema
Na aba Contas, o filtro "Responsável" (e o menu "Atribuir a" dos cartões do funil) lista todos os usuários do sistema — marketing, secretaria e outros perfis aparecem como opções. O correto é aparecerem apenas os corretores.

## Mudança

**Arquivo único: `src/pages/Accounts.tsx`**

No `load()`, hoje a lista `owners` recebe todos os perfis (`profiles`). Passa a filtrar com o mesmo critério já usado na Performance (Relatórios):

1. Buscar `user_roles` (user_id, role) junto com os outros dados.
2. Guardar o conjunto de responsáveis que já têm contas (campo `responsavel_id` das contas já carregadas por `fetchAllContas`).
3. `owners` passa a conter apenas quem:
   - tem papel `corretor`, **ou**
   - tem papel `admin` ou `gestor` **e** é responsável por alguma conta.

Assim Hans Rodovalho (admin/gestor com carteira) continua aparecendo, e Gabriele Nunes (marketing) e demais perfis saem da lista.

## O que muda na tela
- Filtro "Responsável" da aba Contas: só corretores como opções ("Todos os responsáveis" e "Sem responsável" permanecem).
- Menu "Responsável → Atribuir a" dos cartões do funil: mesma lista de corretores (não faz sentido atribuir conta a quem não atende).
- O mapa de nomes (`ownerMap`) não muda: contas atribuídas a qualquer usuário continuam exibindo o nome correto nos cartões e na tabela.

## O que não muda
- Banco de dados, permissões e responsáveis já atribuídos: nada é reatribuído.
- Aba Leads, Oportunidades e demais filtros da aba Contas.

## Validação
- Typecheck (`bunx tsgo --noEmit -p tsconfig.app.json`) e build.
- Playwright: abrir /crm/contas, abrir o filtro Responsável e confirmar que aparecem só Hans, Gabriel, Rafael, Douglas, Larissa, Douglas Torres e Rafael Filimberti — sem marketing/secretaria.
