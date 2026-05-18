## Histórico do imóvel + visitas vinculadas

Toda movimentação (propostas, visitas e venda) passa a aparecer numa **timeline dentro do imóvel**, e agendamentos de visita passam a exigir o imóvel.

### Banco
- `reunioes`: adicionar coluna `imovel_id uuid` (nullable, sem FK formal — mesmo padrão das outras tabelas).
- Sem outras mudanças (propostas já têm `imovel_id`; vendas viram entrada em `activity_log` com `metadata.imovel_id`, que já é gravado).

### UI — Timeline do imóvel
Novo componente `src/components/imoveis/ImovelHistoricoDrawer.tsx`:
- Abre como Sheet ao clicar em **"Histórico"** no card do imóvel (botão novo, em todas as 4 abas).
- Carrega e mescla, ordenado por data desc:
  - **Propostas** (`propostas` where `imovel_id = X`) — mostra status, lead, valor, link "Ver PDF".
  - **Visitas** (`reunioes` where `imovel_id = X`) — mostra data, status (agendada/realizada/cancelada), lead, corretor, local.
  - **Venda** (`activity_log` where `tipo='venda'` e `metadata->>'imovel_id' = X`) — marco final.
- Cabeçalho com título e código do imóvel.

### UI — Selecionar imóvel ao agendar visita
Adicionar campo **"Imóvel visitado"** (combobox buscando em `imoveis`) nos formulários onde uma reunião é criada:
- `src/pages/Meetings.tsx` (modal Nova/Editar reunião)
- `src/pages/Schedule.tsx` (formulário de agendamento)
- `src/pages/LeadDetail.tsx` (criar reunião do lead)
- `src/components/contas/ContaAgendaQuickAdd.tsx` (quick add da conta)

O campo é opcional para não quebrar fluxos antigos, mas fortemente sugerido quando `tipo = 'visita'`. Tipo "visita" será o default sugerido.

### Fora do escopo
- Migração retroativa de visitas antigas para vinculá-las a um imóvel (ficam sem vínculo).
- Edição da timeline diretamente — as alterações continuam acontecendo no fluxo natural (criar proposta, agendar visita, confirmar venda).

### Resumo dos arquivos
- Migration: `ALTER TABLE reunioes ADD COLUMN imovel_id uuid`
- Novo: `src/components/imoveis/ImovelHistoricoDrawer.tsx`
- Edits: `src/pages/Imoveis.tsx` (botão Histórico), `src/pages/Meetings.tsx`, `src/pages/Schedule.tsx`, `src/pages/LeadDetail.tsx`, `src/components/contas/ContaAgendaQuickAdd.tsx`