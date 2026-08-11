# Distribuição de Carteira na barra lateral

A alteração anterior foi feita em um menu antigo (`AppSidebar.tsx`) que não é o usado no CRM. A barra lateral que aparece na sua tela é montada em `AppLayout.tsx`, e lá não existe nenhuma entrada de Carteira — por isso nada mudou.

## O que será feito

1. Adicionar o item **Distribuição de Carteira** (rota `/crm/carteira`) logo depois de **Relatórios**, visível para admin e gestor.
2. Adicionar o item **Minha Carteira** (rota `/crm/minha-carteira`) na lista do CRM, visível para corretores e demais usuários da equipe — sem isso a fase de atendimento da carteira continua inacessível pelo menu.
3. Registrar as duas entradas no controle de permissões de menu, para que possam ser ligadas/desligadas por usuário na tela de Usuários.

## Detalhes técnicos

- `src/hooks/useMenuAccess.tsx`: incluir as chaves `carteira` e `minha-carteira` no tipo `MenuKey` e em `MENU_ITEMS` (grupos Administração e CRM). Em `defaultForRole`: `carteira` só para admin/gestor (bloqueada para corretor, marketing e secretaria); `minha-carteira` liberada para equipe padrão e bloqueada para marketing/secretaria.
- `src/components/AppLayout.tsx`: adicionar `{ to: "/crm/carteira", label: "Distribuição de Carteira", key: "carteira" }` em `adminNav` imediatamente após Relatórios, e `{ to: "/crm/minha-carteira", label: "Minha Carteira", key: "minha-carteira" }` em `baseNav`, com ícone `Briefcase`.
- Nenhuma mudança de rota, backend ou permissão de dados; as páginas já existem e continuam protegidas por `StaffRoute`.
