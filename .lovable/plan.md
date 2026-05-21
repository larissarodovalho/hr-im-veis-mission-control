## Sub-aba "Parceiros" na página Imóveis

Cadastro de corretores externos que fazem parcerias esporádicas. Cada parceiro pode ser vinculado a uma ou várias contas (clientes que ele trouxe, sejam compradores ou vendedores). O campo "Corretor parceiro" em Nova Venda passa a usar essa lista.

### 1. Banco de dados

Nova tabela `public.corretores_parceiros`:
- `nome` (text, obrigatório)
- `telefone`, `email`, `documento` (text)
- `creci` (text)
- `cidade`, `estado` (text)
- `comissao_padrao` (numeric, %)
- `dados_bancarios` (text — pix/banco/agência/conta livre)
- `observacoes` (text)
- `ativo` (boolean, default true)
- `created_by`, `created_at`, `updated_at`

Alteração em `public.contas`:
- Adicionar coluna `parceiro_origem_id` (uuid → `corretores_parceiros.id` ON DELETE SET NULL)

Alteração em `public.vendas`:
- Trocar `corretor_parceiro_id` de "perfil interno" para apontar pra `corretores_parceiros` (coluna mantém o nome; é só um uuid, sem FK estrita).

RLS em `corretores_parceiros`:
- SELECT: todo staff (admin/gestor/corretor).
- INSERT/UPDATE/DELETE: admin/gestor.
- Trigger `update_updated_at_column` em UPDATE.

### 2. Frontend

`src/pages/Imoveis.tsx` — adicionar `<TabsTrigger value="parceiros">Parceiros</TabsTrigger>` e renderizar novo componente `ParceirosTab`.

Novos arquivos:
- `src/pages/imoveis/ParceirosTab.tsx` — tabela com colunas: Nome, Telefone, Email, CRECI, Cidade, Comissão %, Clientes vinculados (contagem), Status (ativo). Botão "Novo parceiro" (admin/gestor). Ações: editar / desativar / excluir.
- `src/components/imoveis/NovoCorretorParceiroDialog.tsx` — formulário com todos os campos da tabela, mais uma seção "Clientes vinculados" listando as contas com `parceiro_origem_id = this.id`, com um SearchableSelect "Vincular conta existente" pra adicionar/remover vínculo (atualiza `contas.parceiro_origem_id`).

Mudanças em formulários existentes:
- `src/components/contas/NovaContaDialog.tsx` — adicionar campo "Trazido pelo parceiro" (SearchableSelect com lista de `corretores_parceiros`).
- `src/pages/AccountDetail.tsx` (aba editar conta) — mesmo campo.
- `src/components/imoveis/NovaVendaDialog.tsx` — substituir o `SearchableSelect` do "Corretor parceiro" para listar `corretores_parceiros` em vez de `profiles`.

### 3. UX

- Badge "via Parceiro X" nas linhas de contas (Accounts.tsx) quando `parceiro_origem_id` estiver setado — opcional, fica para próxima iteração se ficar grande demais nesse turno.
- Toast de confirmação em todas as ações.
- Apenas admin/gestor podem criar/editar/excluir parceiros e vincular contas; corretores apenas visualizam.

### 4. Out of scope

- Cálculo automático de split de comissão entre parceiro e corretor interno.
- Histórico de movimentações por parceiro.
- Exportação CSV de parceiros (pode ser adicionada depois).
- Vincular parceiro a imóveis individualmente (apenas via venda/conta nessa iteração).
