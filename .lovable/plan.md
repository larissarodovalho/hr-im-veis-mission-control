## Adicionar novos perfis ao campo "Interesse"

Atualmente o campo Interesse (em Editar conta, Nova conta e filtro da lista de Contas) tem só opções de operação imobiliária: Comprar, Vender, Alugar, Incorporar, Investimento, Ocasião de oportunidade, Permuta.

Vou adicionar 3 novas opções de perfil:
- Arquiteto
- Construtor
- Corretor parceiro

### Onde mudar

1. `src/pages/AccountDetail.tsx` — dialog "Editar conta": adicionar os 3 `SelectItem` no select de Interesse.
2. `src/pages/Accounts.tsx` — filtro "Interesse" no topo da lista: adicionar os mesmos 3 itens para permitir filtrar.
3. `src/components/contas/NovaContaDialog.tsx` — se o dialog "Nova conta" tiver o mesmo select, espelhar as opções (vou conferir e ajustar se houver).

Sem mudança de schema: a coluna `interesse` em `contas` já é texto livre, então só precisamos expor as novas opções na UI. Contas existentes não são afetadas.

Confirma que são exatamente esses 3 perfis (Arquiteto, Construtor, Corretor parceiro)? Quer também "Corretor" simples ou só "Corretor parceiro"?