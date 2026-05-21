## Adicionar etapa do funil ao "Editar conta"

**Onde:** `/crm/contas/:id` → botão "Editar dados" (dialog em `src/pages/AccountDetail.tsx`).

**O que muda:**
1. No formulário de edição, adicionar um campo **Etapa do funil** (Select) com as opções na ordem definida em `src/lib/contasFunil.ts` (`ETAPAS`):
   - A contatar → Contatado → Sem retorno → Contato estabelecido → Captação/Imóvel → Reunião → Visita → Proposta → Fechado → Followup
2. Inicializar o valor do select a partir de `acc.etapa_funil` (default `a_contatar`) ao abrir o dialog.
3. No `handleSave`, incluir `etapa_funil: editing.etapa_funil` no `update` da tabela `contas`.
4. Carregar `etapa_funil` no `select(...)` da query de detalhe da conta (se ainda não vier).

**Fora de escopo:** Kanban, novas colunas no banco (campo já existe), regras de RLS, alterações no NovaContaDialog.

**Validação:** abrir conta → Editar dados → trocar etapa → salvar → recarregar; valor persiste e a coluna no Kanban (/crm/contas) reflete a mudança.
