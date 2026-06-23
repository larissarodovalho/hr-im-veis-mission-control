## Nome do cliente clicável no Kanban de Oportunidades

Hoje, no card de Oportunidade (aba Imóveis → Oportunidades), o nome do cliente é só texto. Clicar no card abre o diálogo de edição da oportunidade, mas não há atalho para a ficha do cliente onde se registra histórico de interações (mensagens, ligações, etapas).

### Mudança

No `src/pages/imoveis/OportunidadesTab.tsx`, dentro do `OportunidadeCard`:

1. Transformar o nome do cliente em um link clicável:
   - Se `op.cliente_tipo === "lead"` → navega para `/crm/leads/:id`
   - Se `op.cliente_tipo === "conta"` → navega para `/crm/contas/:id`
2. Usar `Link` do `react-router-dom` com `onClick` que chama `e.stopPropagation()` para não disparar o drag nem abrir o diálogo de edição da oportunidade.
3. Estilo: sublinhado sutil no hover, cursor pointer, manter o ícone (User/Building2) ao lado.

A ficha do lead (`LeadDetail.tsx`) e a da conta (`AccountDetail.tsx`) já têm o timeline de interações, responsável e etapa — é onde o usuário vai atualizar o atendimento.

### Sincronização

Já existe naturalmente: a oportunidade referencia `cliente_id` (lead ou conta), e a ficha do cliente é a fonte única de verdade do histórico de interações. Nenhuma duplicação de dado é criada.

### Sem mudanças

- Sem schema/RLS.
- Sem alteração no diálogo de edição da oportunidade (segue abrindo ao clicar no resto do card).
- Sem alteração nas demais colunas/lógica do Kanban.
