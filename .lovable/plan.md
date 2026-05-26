## Adicionar edição de cliente na oportunidade

### Problema
Em `EditarOportunidadeDialog`, ao reabrir uma oportunidade já criada, não existe campo para alterar o cliente vinculado (lead ou conta). Só dá pra trocar título, valor, estágio, corretor, imóveis e observações. Quem vinculou o cliente errado precisa excluir e recriar.

### Mudança em `src/components/imoveis/EditarOportunidadeDialog.tsx`

1. Adicionar estados `clienteTipo` ("lead" | "conta") e `clienteId`, inicializados a partir de `oportunidade.cliente_tipo` e `oportunidade.cliente_id` no `useEffect`.
2. Carregar listas `leads` (id, nome) e `contas` (id, nome) junto com imoveis/corretores.
3. Renderizar logo abaixo do "Título", em duas colunas:
   - `Select` "Tipo de cliente" (Lead / Conta) — ao trocar, reseta `clienteId` para `"none"`.
   - `SearchableSelect` "Cliente" usando a lista correspondente ao tipo selecionado.
4. No `submit`, validar que `clienteId !== "none"` e incluir `cliente_tipo` e `cliente_id` no `update` da tabela `oportunidades`.

Sem mudanças de schema, sem mexer em outros arquivos.
