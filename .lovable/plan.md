## Alargar os KPIs da aba Vendidos

**`src/pages/imoveis/VendidosTab.tsx`** (linha 144)
- Trocar `lg:grid-cols-4` por `lg:grid-cols-3` no grid dos KPIs, já que agora só restam 3 cards. Isso dá ~33% de largura a cada um, evitando que valores grandes sejam cortados.

Se mesmo assim o valor cortar em telas menores, também posso aumentar o `value` para usar `text-2xl` em vez do tamanho atual — me avise se quiser.
