Na aba **Vendidos** de Imóveis, mudar o filtro de período padrão de "Últimos 90 dias" para **"Último ano"**.

### Alteração
`src/pages/imoveis/VendidosTab.tsx` linha 35:
```ts
const [periodo, setPeriodo] = useState<Periodo>("365");
```

Nenhuma outra mudança.