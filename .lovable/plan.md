## Adicionar "Proposta" na seção Agendar da Conta

Novo botão **Proposta** ao lado de Reunião/Ligação/Visita/Captação em `ContaAgendaQuickAdd`, com diálogo próprio para o corretor registrar a proposta enviada ao cliente.

### Campos do diálogo
- **Data da proposta** (data)
- **Valor** (opcional, R$)
- **Status**: Pendente / Aceita / Recusada
- **Descrição / condições** (textarea)

### Backend (nova migração)
Nova tabela `public.conta_propostas`:
- `conta_id` (FK contas)
- `data_proposta` (date)
- `valor` (numeric, opcional)
- `status` ('pendente' | 'aceita' | 'recusada', default 'pendente')
- `descricao` (text)
- `corretor_id`, `created_by`, timestamps

RLS espelhando `conta_fechamentos`: acesso restrito a admin/gestor, responsável da conta e criador.

### Frontend
- `src/components/contas/ContaAgendaQuickAdd.tsx`: adicionar tipo `"proposta"`, botão, e branch de save que insere em `conta_propostas`. Não cria evento no Google Calendar (não é compromisso).
- Novo componente `src/components/contas/ContaPropostas.tsx`: lista propostas registradas da conta (data, valor, status com badge colorido, descrição) com opção de alterar status posteriormente e excluir.
- `src/pages/AccountDetail.tsx`: renderizar `ContaPropostas` próximo a `ContaFechamentos`.

Nenhuma alteração no funil ou em outras telas.
