## Diagnóstico
**Acesso a dados (já está OK):** As policies de RLS já isolam corretor por `responsavel_id`/`corretor_id`/`created_by` em `contas`, `leads`, `contatos`, `interacoes`, `ligacoes`, `reunioes`, `propostas`. Ou seja, mesmo se um corretor abrir qualquer tela, o banco só devolve os registros dele. Nada a mudar no banco.

**Acesso às abas (precisa corrigir):** Hoje o menu lateral esconde "Relatórios / Newsletter / Usuários / Configurações" para corretor (via `isAdmin || isGestor`), **mas as rotas não estão protegidas**. Um corretor que digite `/crm/relatorios` na URL consegue abrir a página.

## Correção
Proteger as 4 rotas com o `StaffRoute` já existente (que redireciona corretor para `/crm`):

Em `src/App.tsx`, dentro do bloco do CRM (linhas ~89-110), envolver:
- `<Route path="relatorios" element={<StaffRoute><Reports /></StaffRoute>} />`
- `<Route path="newsletter" element={<StaffRoute><Newsletter /></StaffRoute>} />`
- `<Route path="usuarios" element={<StaffRoute><Users /></StaffRoute>} />`
- `<Route path="configuracoes" element={<StaffRoute><ConfiguracoesPage /></StaffRoute>} />`

Adicionar `import StaffRoute from "@/components/StaffRoute";` no topo.

## Observação
A nav lateral já está correta para corretor (não mostra essas 4 abas). Só falta a proteção de rota como cinto-de-segurança.

## Escopo
- Só `src/App.tsx`. Nenhuma mudança em banco, RLS ou outras telas.
