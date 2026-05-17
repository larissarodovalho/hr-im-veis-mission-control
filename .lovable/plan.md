## Objetivo

Permitir que o **admin** exclua definitivamente documentos de assinatura quando estiverem em estado final (cancelado, expirado, recusado). Hoje só dá pra cancelar — não há como remover da lista.

## Mudanças

### 1. `src/pages/DocumentDetail.tsx`
- Adicionar botão **"Excluir definitivamente"** (variant destructive, ícone Trash2) no header da página.
- Visível **apenas para admin** (`useRole().isAdmin`) e somente quando `doc.status` for `canceled`, `expired` ou `refused`.
- AlertDialog de confirmação ("Esta ação é irreversível...").
- Ação: deletar `signed_documents` pelo id (cascata já remove signers/events via RLS admin-only que já existe). Após sucesso, `toast.success` + `navigate("/crm/documentos")`.

### 2. `src/pages/Documents.tsx`
- Adicionar botão de excluir (ícone Trash2) no canto do card, visível só para admin e só quando status for final (`canceled`/`expired`/`refused`).
- `stopPropagation` no clique pra não abrir o detalhe.
- AlertDialog de confirmação + delete + `load()` pra atualizar a lista.

### 3. Banco
- Nenhuma mudança. A policy `docs delete admin only` já existe em `signed_documents`, `document_signers` e `document_events`.
- Verificar se há FK com `ON DELETE CASCADE` entre `document_signers/events` → `signed_documents`. Se não houver, fazer o delete em cascata manual no frontend (signers → events → document) ou adicionar a FK via migração. Confirmar durante a implementação.

## Fora de escopo

- Não permite excluir documentos ativos (status `sent`, `partially_signed`, `signed`) — pra esses continua só a opção de cancelar.
- Gestor/corretor continuam sem poder excluir.
