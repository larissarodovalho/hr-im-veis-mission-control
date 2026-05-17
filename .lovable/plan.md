## Resumo
Na tabela da subaba **"Todos"** (/app/contas?lista=todos), adicionar uma coluna fixa exibindo a qualificação de cada contato (Carteira ou Marketing, derivado das tags), e renomear a coluna "Proprietário" para "Responsável".

## Alterações

### 1. Tabela desktop (`Accounts.tsx`)
- Inserir nova coluna de cabeçalho **"Qualificação"** entre "CPF/CNPJ" e o que será renomeado para "Responsável".
- Inserir célula correspondente em cada linha com um `Badge` azul para "Carteira" ou rosa para "Marketing" (ou "—" se nenhuma). Usar a mesma lógica de cores já existente no `AccountDetail.tsx`.
- Renomear o cabeçalho **"Proprietário"** para **"Responsável"**.
- Renomear o label "Proprietário" nos cards mobile também para manter consistência.
- Ajustar `colSpan` das mensagens de estado (loading / vazio) de 7 para 8.

### 2. Cards mobile (`Accounts.tsx`)
- Adicionar linha exibindo a qualificação no card de cada conta.

## O que não muda
- Nenhuma alteração nas subabas "Carteira" e "Marketing".
- Nenhuma alteração no backend, na exportação (ainda será usado "Proprietário" no Excel por enquanto, para não quebrar o formato) e nem nos dados existentes.

## Cenários de validação
- Contato com tag `carteira` exibe badge azul "Carteira".
- Contato com tag `marketing` exibe badge rosa "Marketing".
- Contato sem nenhuma das duas tags exibe "—".
- O texto do cabeçalho e do card mobile diz "Responsável", não "Proprietário".