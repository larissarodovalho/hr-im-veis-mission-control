## Objetivo

Permitir criar **tarefas com prazo no futuro** dentro do cadastro da conta (cliente) e ter uma **aba lateral "Tarefas"** no CRM listando todas as tarefas pendentes de todo o sistema.

A tabela `tarefas` já existe (com `titulo`, `descricao`, `prazo`, `prioridade`, `status`, `responsavel_id`, `lead_id`, `created_by`). Falta só conectar a contas e construir a UI.

## 1. Banco (migration)

- Adicionar coluna `conta_id uuid` em `public.tarefas` com FK → `contas(id) ON DELETE SET NULL` e índice.
- RLS atual já cobre (`responsavel_id`/`created_by`/admin/gestor) — sem mudança de política.

## 2. Componente novo `src/components/contas/ContaTarefas.tsx`

- Recebe `contaId` e `responsavelId`.
- Header "Tarefas" + botão "Nova tarefa".
- Dialog de criação: `titulo*`, `prazo` (datetime-local, padrão amanhã 09:00), `prioridade` (Baixa/Média/Alta), `responsavel` (select de profiles ativos, padrão responsavel da conta ou user atual), `descrição`.
- Lista de tarefas dessa conta (`conta_id=eq.{id}`), ordenada por `prazo` asc, divididas em **Pendentes** (status ≠ "Concluída") e **Concluídas** (recolhíveis).
- Cada item: checkbox para marcar como concluída (`status='Concluída'`), badge de prioridade, prazo formatado com destaque vermelho se atrasada, nome do responsável, botão excluir (admin ou autor).
- Realtime: `postgres_changes` em `tarefas` filtrado por `conta_id`.

## 3. `src/pages/AccountDetail.tsx`

- Importar `ContaTarefas` e renderizar em um `<Card>` logo abaixo do bloco "Agendamentos" (antes de "Propriedades / Negócios").

## 4. Página global `src/pages/Tasks.tsx` (aba lateral "Tarefas")

- Rota nova: `/crm/tarefas` (em `src/App.tsx` dentro do bloco CRM).
- Lista todas as tarefas visíveis ao usuário (admin/gestor vê todas; corretor vê as próprias via RLS).
- Filtros no topo: status (Pendentes/Concluídas/Todas — padrão Pendentes), prazo (Hoje/Esta semana/Atrasadas/Futuras/Todas — padrão Futuras+Atrasadas), busca por título, responsável (admin/gestor).
- Agrupamento por dia (Atrasadas / Hoje / Amanhã / Esta semana / Mais tarde / Sem prazo).
- Cada linha: título, prioridade, prazo, link para a conta (se `conta_id`) ou lead (se `lead_id`), responsável, ação concluir/reabrir/excluir.
- Botão "Nova tarefa" (sem conta vinculada) reutilizando o mesmo dialog de criação.

## 5. Sidebar / navegação

- `src/components/AppSidebar.tsx`: o item "Tarefas" já existe sob CRM mas usa `?tab=tarefas`. Trocar para `NavLink` real apontando para `/crm/tarefas` (alinhado ao padrão das outras subtabs como `/crm/visitas`).
- Verificar/ajustar `CORRETOR_ALLOWED_CRM` para incluir `tarefas` (corretor precisa ver as próprias).

## Fora de escopo

- Notificações por email/whatsapp do prazo.
- Recorrência de tarefas.
- Integração com calendário externo.
