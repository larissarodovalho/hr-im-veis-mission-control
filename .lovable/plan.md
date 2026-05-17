## Objetivo
Remover o filtro **Aptidão** ("Todas as aptidões") da barra de filtros da página de Contas.

## Mudanças (`src/pages/Accounts.tsx`)
1. Remover o `<Select>` de aptidão (linhas ~342–352) do grid de filtros.
2. Remover o estado `aptitudeFilter` e o tipo `Aptitude` se não usado em outro lugar (manter `APT_LABEL`/`APT_BADGE` se ainda usados em exibição de propriedades).
3. Remover a condição `aptitudeFilter !== "todas"` da função `filtered`.
4. Ajustar o grid de `lg:grid-cols-5` para `lg:grid-cols-4`.

## Fora de escopo
Banco de dados, abas Todos/Carteira/Marketing e demais filtros permanecem inalterados.