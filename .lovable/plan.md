## Filtros com botão "Aplicar" + export personalizado

Em `src/pages/Accounts.tsx`:

### 1. Filtros só aplicam ao clicar em "Aplicar"
- Separar dois conjuntos de estado: os filtros "rascunho" (que mudam enquanto o usuário mexe) e os filtros "aplicados" (que de fato filtram a lista).
  - Rascunho: `draftSearch`, `draftStatusFilter`, `draftInterestFilter`, `draftTypeFilter`, `draftTempFilter`, `draftOwnerFilter`.
  - Aplicados: os estados atuais (`search`, `statusFilter`, `interestFilter`, `typeFilter`, `tempFilter`, `ownerFilter`) — usados em `filtered`.
- Cada `Input`/`Select` lê e escreve no rascunho.
- Adicionar dois botões à direita da barra de filtros:
  - **Aplicar** (primary): copia rascunho → aplicados.
  - **Limpar**: zera rascunho e aplicados para o default ("todos"/"").
- "Aplicar" também dispara em `Enter` dentro do input de busca.
- Mostrar um pequeno indicador "Filtros não aplicados" quando rascunho ≠ aplicados, para o usuário lembrar de clicar OK.
- Chips de filtros ativos (Tipo: Cliente, Temperatura: Frio…) abaixo da barra para deixar visível o que está segmentando a lista, cada chip com um "x" pra remover individualmente (remove do aplicado e do rascunho).

### 2. Exportar com colunas personalizadas
- Substituir os itens "Excel (.xlsx)" / "CSV" do dropdown Exportar por um único item **"Exportar relatório…"** que abre um `Dialog`.
- Dentro do dialog:
  - Lista de checkboxes com todas as colunas disponíveis. Defaults marcados: Nome, Telefone, Email, CPF/CNPJ, Responsável, Tipo, Status, Criado em. Outras opções: Interesse, Temperatura, Tags, Ramo de atividade, Etapa do funil, Observações, Endereço, Valor total negócios, Valor total comissão.
  - Radio para formato: Excel (.xlsx) ou CSV.
  - Resumo: "X contas serão exportadas com Y colunas".
  - Botão "Baixar".
- `buildExportRows` passa a receber a lista de colunas selecionadas e devolve só esses campos, na ordem escolhida.
- Persistir a última seleção de colunas em `localStorage` (`contas:export:cols`, `contas:export:format`) para a próxima exportação já vir pronta.

### Fora de escopo
- Sem mudanças no Kanban, no menu de três pontinhos, no schema do banco ou nas RLS.
- Sem mudanças na view "Lista" além das que vierem naturalmente do `filtered`.
- Sem alteração no comportamento dos filtros em outras páginas (Leads, Imóveis etc.).