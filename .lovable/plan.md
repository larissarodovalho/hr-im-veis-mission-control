## Objetivo
Substituir os dois inputs de filtro de valor (mínimo e máximo) na página de Imóveis por um único dropdown (Select) com faixas de valor pré-definidas.

## Alterações no arquivo `src/pages/Imoveis.tsx`

### Estado
- Remover `valorMin` e `valorMax` (strings).
- Adicionar `faixaValor` (string, default `"all"`).

### Lógica de filtro
- Substituir `matchesValor` por `matchesFaixaValor` que interpreta as opções do select:
  - `"all"` → qualquer valor
  - `"0-500000"` → até R$ 500.000
  - `"500000-1000000"` → R$ 500.000 a R$ 1.000.000
  - `"1000000-2000000"` → R$ 1.000.000 a R$ 2.000.000
  - `"2000000-5000000"` → R$ 2.000.000 a R$ 5.000.000
  - `"5000000-10000000"` → R$ 5.000.000 a R$ 10.000.000
  - `"10000000-20000000"` → R$ 10.000.000 a R$ 20.000.000
  - `"20000000+"` → acima de R$ 20.000.000

### UI
- Remover os dois `<Input type="number">` de valor mín/máx.
- Adicionar um único `<Select value={faixaValor} onValueChange={setFaixaValor}>` com as opções acima, apresentadas de forma legível (ex: "Até R$ 500 mil", "R$ 500 mil – R$ 1 milhão", etc.).

### Limpar filtros
- Atualizar `algumFiltro` e `limparFiltros` para usar `faixaValor !== "all"` em vez de `valorMin/valorMax`.

Nenhuma alteração de schema ou backend necessária.