## Remover KPI "Origem das vendas"

**`src/pages/imoveis/VendidosTab.tsx`**
- Excluir o bloco `<KPI title="Origem das vendas" …>` (linhas ~191–201), mantendo apenas os 3 KPIs: Valor total, Quantidade, Ticket médio.
- Remover variáveis/imports que ficarem sem uso (`origemPie` e possivelmente `PIE`/`Cell` se não forem mais usados nos outros KPIs — verificar antes de remover).
