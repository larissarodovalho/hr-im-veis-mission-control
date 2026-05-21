## Objetivo
Hoje só o administrador consegue excluir reuniões, ligações e visitas. A gestão e os corretores (donos do registro) também devem conseguir excluir e editar.

## Mudanças

### 1. Banco de dados (RLS) — migration
Substituir as policies de DELETE para alinhar com as de UPDATE:

- `reunioes` — DELETE permitido a: admin, gestor, `corretor_id = auth.uid()`, ou `created_by = auth.uid()`.
- `ligacoes` — mesma regra acima.
- `visitas` — DELETE permitido a: admin, gestor, `corretor_id = auth.uid()`, ou `created_by = auth.uid()` (hoje só admin/gestor).

Policies de SELECT/UPDATE permanecem como estão.

### 2. Frontend
Mostrar o botão "Excluir" no diálogo de edição para qualquer usuário staff (não só admin). Como o RLS já restringe, basta liberar a UI:

- `src/pages/Meetings.tsx` (linha 325)
- `src/pages/Calls.tsx` (linha 267)
- `src/pages/Visits.tsx` (linha 258)

Trocar `{isAdmin ? <Button…Excluir/> : <span/>}` por exibir sempre o botão Excluir. Se o usuário não tiver permissão no RLS, o toast de erro já cobre.

## Fora de escopo
- Página `Schedule.tsx` (bloqueios de agenda) — segue admin-only.
- Mudanças em criação/edição de registros.
