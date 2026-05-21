## Sub-aba "Vendidos" na página Imóveis

Adicionar uma nova sub-aba dentro de `/crm/imoveis` para registrar e acompanhar imóveis vendidos, com KPIs no topo e tabela detalhada (espelhando o layout do exemplo anexado). Lançamento dual: conversão automática de proposta "Aceita" + lançamento manual. Permissão de criação/edição restrita a admin/gestor; corretor apenas visualiza as próprias.

### 1. Banco de dados

Nova tabela `public.vendas`:

- `imovel_id` (uuid → imoveis, ON DELETE SET NULL)
- `proposta_id` (uuid → propostas, ON DELETE SET NULL, opcional — preenchido em conversão)
- `lead_id` / `conta_id` (uuid, opcionais — vínculo com cliente)
- `cliente_nome` (text, obrigatório — fallback quando sem lead/conta)
- `corretor_id` (uuid — corretor responsável)
- `valor_venda` (numeric)
- `valor_comissao` (numeric)
- `percentual_comissao` (numeric, opcional)
- `tipo` (text: "Venda" | "Aluguel", default "Venda")
- `status_pagamento` (text: "Pagamento pendente" | "Finalizada" | "Cancelada", default "Pagamento pendente")
- `origem` (text: ex. "Site", "Indicação", "Tráfego pago"…)
- `data_venda` (timestamptz, default now())
- `observacoes` (text)
- `created_by`, `created_at`, `updated_at`

RLS:
- SELECT: admin/gestor vê tudo; corretor vê quando `corretor_id = auth.uid()` ou `created_by = auth.uid()`.
- INSERT/UPDATE/DELETE: apenas admin/gestor (`is_admin()`).

Trigger `update_updated_at_column` em UPDATE.

Índices em `imovel_id`, `corretor_id`, `data_venda`.

### 2. Backend behavior

Ao criar venda (manual ou via conversão), opcionalmente atualizar `imoveis.status` para `"Vendido"`. Feito no frontend após o insert (admin/gestor já pode atualizar imóveis).

Conversão a partir de proposta Aceita: botão "Registrar venda" em `NovaPropostaDialog`/lista de propostas aceitas que pré-preenche o diálogo de nova venda com `proposta_id`, `imovel_id`, `lead_id`, `corretor_id`, `valor_venda` e abre o formulário pra completar comissão, tipo, status de pagamento e origem.

### 3. Frontend

`src/pages/Imoveis.tsx` — adicionar `<TabsTrigger value="vendidos">Vendidos</TabsTrigger>` e renderizar novo componente `VendidosTab`.

Novos arquivos:

- `src/pages/imoveis/VendidosTab.tsx` — orquestra KPIs + tabela + botão "Nova venda" (visível apenas a admin/gestor via `useRole`).
- `src/components/imoveis/VendasKPIs.tsx` — 4 cards estilo do exemplo:
  - **Valor total das vendas** (soma `valor_venda`) com sparkline + variação vs período anterior
  - **Quantidade de vendas** (count) com donut por status + variação
  - **Ticket médio** (valor_total / count) com sparkline + variação
  - **Origem das vendas** (mini donut por `origem`)
  - Filtro de período (Mês atual / Últimos 30d / Últimos 90d / Ano)
- `src/components/imoveis/VendasTable.tsx` — colunas:
  Nome (cliente_nome), Imóvel (codigo), Valor, Comissão, Corretor (avatar do profile), Status (badge colorido), Tipo (badge), Data da Venda. Ações: editar / excluir (admin/gestor).
- `src/components/imoveis/NovaVendaDialog.tsx` — formulário com SearchableSelect para imóvel/lead/conta/corretor, campos de valor, comissão (R$ e %), tipo, status, origem, data, observações. Aceita `initialData` para conversão de proposta.

Charts: usar `recharts` (já no projeto via `src/components/ui/chart.tsx`).

### 4. Permissões e UX

- Botão "Nova venda" e ações de edição/exclusão escondidos para corretor (mostra somente a tabela das próprias vendas).
- Toast de confirmação após criar/editar/excluir.
- Atualização do `imoveis.status` é opt-in via checkbox "Marcar imóvel como vendido" no diálogo (default ligado).

### 5. Out of scope

- Relatório financeiro avançado / split de comissão por equipe.
- Edição em lote.
- Exportação CSV (pode ser adicionada depois reutilizando o padrão de `Reports.tsx`).
