Adicionar nova etapa "Contato estabelecido" ao funil do Kanban (Carteira e Marketing).

Alteração única em `src/lib/contasFunil.ts`:

- Adicionar `"contato_estabelecido"` ao tipo `EtapaFunil`.
- Inserir no array `ETAPAS` logo após `contatado` e antes de `sem_retorno`:
  ```
  { id: "contato_estabelecido", label: "Contato estabelecido", color: "bg-cyan-500/15 text-cyan-700 border-cyan-500/30" }
  ```

Ordem final: A contatar → Contatado → Contato estabelecido → Sem retorno → Reunião → Visita → Proposta → Fechado → Perdido.

O Kanban (`ContasKanban.tsx`) e o banco aceitam `etapa_funil` como texto livre, então nenhuma migração nem alteração no componente é necessária — a coluna aparece automaticamente.