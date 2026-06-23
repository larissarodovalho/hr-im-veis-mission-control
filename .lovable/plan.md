## Mostrar "criado por" em leads e contas

Hoje exibimos apenas o **responsável** (corretor_id / responsavel_id). Vamos adicionar também quem **criou** o registro (`created_by`) — o corretor que originou o contato.

### Mudanças

**1. Kanban de Leads (`src/pages/Leads.tsx`)**
- Incluir `created_by` no tipo `Lead` e no select.
- No card, adicionar uma 2ª etiqueta ao lado da etiqueta de responsável: `✍️ Criado: <nome>`.
- Se `created_by === corretor_id`, mostrar **apenas a etiqueta de responsável** (evita poluição visual quando é a mesma pessoa).
- Reutilizar o mapa `brokers` já carregado.

**2. Detalhe do Lead (`src/pages/LeadDetail.tsx`)**
- Adicionar uma linha "Criado por" no painel de informações, ao lado/abaixo de "Responsável", mostrando nome do corretor (ou "—").

**3. Kanban de Contas (`src/components/contas/ContasKanban.tsx`)**
- Incluir `created_by` no tipo e select.
- Adicionar etiqueta `✍️ Criado: <nome>` no card, mesma regra de ocultar quando igual ao responsável.

**4. Detalhe da Conta (`src/pages/AccountDetail.tsx`)**
- Adicionar linha "Criado por" no painel de informações.

### Detalhes técnicos

- Nenhuma mudança de schema, RLS ou backend: `created_by` já existe em `leads` e `contas` e é preenchido na criação.
- Mapa de nomes vem de `profiles` (já carregado em ambos os Kanbans).
- Badge usa `variant="outline"`, `text-[10px]`, ícone `PencilLine` do `lucide-react` para diferenciar visualmente do responsável (`User`).
- Mostrar nome no formato "Primeiro Ú." (helper `shortName` já existe no `Leads.tsx`; replicar em `ContasKanban.tsx`).