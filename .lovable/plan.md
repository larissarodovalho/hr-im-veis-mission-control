## Objetivo
Permitir que o corretor vincule (opcionalmente) um imóvel a cada proposta registrada dentro da conta, para gerar histórico de propostas por imóvel e por cliente.

## Mudanças

### 1. Banco (migração)
Adicionar coluna `imovel_id uuid` (nullable) em `public.conta_propostas` com FK para `public.imoveis(id) ON DELETE SET NULL` e índice `conta_propostas_imovel_idx`.

### 2. UI — `src/components/contas/ContaPropostas.tsx`
- Carregar lista de imóveis (id, código, título) junto com as propostas — mesmo padrão usado em `ContaFechamentos`.
- Adicionar um `<select>` "Imóvel vinculado" no diálogo de criar/editar proposta, com opção "— Nenhum —".
- Exibir um badge com código/título do imóvel em cada card de proposta quando houver vínculo.
- Persistir `imovel_id` no insert/update.

### 3. Relatório — `src/components/reports/PropostasReport.tsx`
- Carregar imóveis referenciados (código/título) das propostas exibidas.
- Nova coluna "Imóvel" na tabela detalhada (código + título, ou "—").
- Incluir a coluna "Imóvel" nas exportações CSV e Excel (aba Detalhado).

Nenhuma alteração de RLS necessária — as policies existentes de `conta_propostas` continuam válidas.
