## Problema

Na página Imóveis (`/imoveis`) no mobile, a barra "Filtrar Imóveis" está cortando conteúdo:

1. As pílulas de tipo (Todos / Casa / Sobrado / Apartamento) ficam num `flex` interno sem `flex-wrap`, então "Apartamento" estoura para fora da tela e fica cortado pela direita.
2. O seletor de **Valor** (faixa de preço) está com `hidden md:block` — ou seja, **não aparece no mobile**, então o usuário não consegue filtrar por valor pelo celular.
3. O botão de limpar filtros (X) e o divisor vertical também podem estourar a linha em telas estreitas.

## Solução (apenas frontend, em `src/pages/site/ImoveisPage.tsx`)

Reorganizar a barra de filtros (linhas ~177–310) para ficar fluida no mobile, mantendo o visual atual no desktop:

1. **Pílulas de tipo**: trocar o wrapper interno `flex items-center gap-1.5` por algo que permita quebra de linha no mobile (`flex flex-wrap gap-1.5 w-full sm:w-auto`), e reduzir um pouco o `px` das pílulas no mobile (`px-4 sm:px-5`) para garantir que os 4 tipos caibam em uma ou duas linhas sem cortar.
2. **Seletor de Valor**: trocar `hidden md:block` por visível em todos os breakpoints (`relative w-full sm:w-auto`). No mobile o botão fica em largura total abaixo das pílulas e o dropdown ancorado abaixo dele (`left-0 right-0 sm:right-0 sm:left-auto`).
3. **Busca**: manter a busca mobile separada que já existe abaixo (linhas 298–309).
4. **Divisores verticais** (`h-5 w-px`): manter `hidden sm:block` (já está) — sem mudança.
5. **Container**: reduzir o padding interno no mobile (`p-4 sm:p-6`) e garantir `overflow-visible` para o dropdown de valor não ser cortado.
6. **Botão Limpar (X)**: garantir que não force overflow no mobile (já está dentro do `flex-wrap`, então OK após mudança 1).

Nenhuma mudança de lógica de filtro, dados ou estilos do desktop — apenas ajustes responsivos.

## Resultado esperado

No mobile (viewport ~390px):
- Todos os 4 tipos visíveis (com quebra se necessário, sem corte horizontal).
- Seletor de **Valor** disponível e funcional.
- Campo de busca em largura total.
- Sem rolagem horizontal indesejada na seção.
