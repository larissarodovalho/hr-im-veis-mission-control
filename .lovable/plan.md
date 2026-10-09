# Restringir a aba "Vendidos" a administradores e gestores

## Objetivo
Na página Imóveis, a subaba **Vendidos** (valores de venda, comissões e contratos) fica visível apenas para **administradores e gestores**. Corretores e demais perfis não veem a aba nem conseguem abri-la pelo link direto.

## Mudanças

### `src/pages/Imoveis.tsx`
- Usar `isAdmin || isGestor` (já disponíveis via `useAuth`) para controlar a aba Vendidos:
  - O botão da aba "Vendidos" só aparece para admin/gestor.
  - O contador de vendidos no resumo do topo só aparece para admin/gestor.
  - O conteúdo da aba (`VendidosTab`) só é renderizado para admin/gestor.
  - Se um corretor abrir o link direto `?tab=vendidos`, a página cai automaticamente na aba "Disponíveis".

### `src/pages/imoveis/VendidosTab.tsx`
- Proteção extra: se um usuário sem permissão chegar ao componente, mostrar aviso "Acesso restrito a administradores e gestores" em vez dos dados (defesa em dupla camada).

## O que não muda
- Admin e gestor continuam vendo e usando a aba normalmente (lançar venda, editar, excluir, ver contrato).
- As demais abas (Disponíveis, Não publicados, Inativos, Em Proposta, Em Fechamento etc.) continuam visíveis para todos.
- O clique no código do imóvel na tabela de vendas continua levando à aba Inativos (só afeta quem tem acesso).
- Nenhuma mudança no banco de dados.

## Verificação
- Entrar no preview como admin/gestor: aba Vendidos visível e funcionando.
- Conferir que para corretor a aba não aparece e o link direto redireciona para Disponíveis.
- Typecheck e testes.
