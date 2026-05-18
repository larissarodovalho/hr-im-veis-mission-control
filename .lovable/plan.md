## Mudanças

### Banco (`imoveis`)

- Adicionar coluna `codigo TEXT UNIQUE` (formato `HR-0001`).
- Adicionar coluna `proprietario_id UUID` referenciando uma conta em `contas`.
- Sequência `imoveis_codigo_seq` + trigger `BEFORE INSERT` que preenche `codigo = 'HR-' || lpad(nextval(...)::text, 4, '0')` quando vier nulo.
- Backfill: gera código para os imóveis já cadastrados.
- RLS já cobre `UPDATE` para admin/gestor/corretor responsável, sem mudança.

### Cadastro de imóvel (`NovoImovelDialog`)

Nova seção "Responsável e proprietário" com:
- **Corretor responsável** — `Select` populado com `profiles` (usuários ativos). Default: usuário logado.
- **Proprietário** — `SearchableSelect` que lista contas (`contas.nome` + documento). Ao lado, botão "Nova conta" abre `NovaContaDialog` já existente; ao salvar, a conta criada é automaticamente vinculada.
- No `insert` da tabela `imoveis`: passar `corretor_id` escolhido e `proprietario_id`. Não enviar `codigo` (trigger gera).
- Após salvar, exibir toast com o código gerado (refetch breve).

### Edição (`EditarImovelDialog`)

- Mesma seção: editar corretor responsável e proprietário (com opção "Nova conta").
- Exibir o `codigo` (somente leitura) no topo do diálogo.

### Listagem CRM (`Imoveis.tsx`)

- Mostrar `codigo` como badge no card.
- Mostrar nome do corretor responsável e do proprietário em linha discreta.

### Site público

- `ImoveisPage` e `ImovelDetalhePage` passam a usar `row.codigo` quando existir (fallback para o `HR-<id>` atual).

## Fora de escopo

- Histórico de troca de responsável/proprietário.
- Múltiplos proprietários por imóvel.
- Comissionamento/contratos atrelados ao proprietário.
