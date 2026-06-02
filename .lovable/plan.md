## Contexto
Os filtros da aba Imóveis usam textos longos na opção padrão (ex.: "Todos os anos", "Qualquer valor"). O usuário quer rótulos mais curtos e diretos.

## Mudança
Alterar apenas os 4 textos da opção `value="all"` nos `SelectItem` de `src/pages/Imoveis.tsx`:

| Local atual | Novo texto |
|---|---|
| "Todos os anos" | "Ano" |
| "Todos os meses" | "Mês" |
| "Todos os captadores" | "Captador" |
| "Qualquer valor" | "Valor" |

## Detalhes técnicos
- Nenhuma lógica de filtro muda.
- Apenas os labels de exibição no dropdown são alterados.
- `SelectValue placeholder` já reflete os nomes curtos, então os placeholders continuam corretos.