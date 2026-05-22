## Bug identificado
No relatório de Faturamento, as comissões por papel (Vendedor / Captador / HR) estão sendo calculadas de forma errada — aplicando o percentual **duas vezes**.

### Causa
Os campos `percent_vendedor`, `percent_captador` e `percent_hr` salvos em `vendas` representam o **% sobre o VGV** (somam 5% no exemplo: Captador 1% + Vendedor 2% + HR 2%).

O `valor_comissao` já é `VGV × 5% = R$ 90.000`.

Hoje o relatório faz:
```ts
r.com_vendedor += com * (percent_vendedor / 100)
// 90.000 × 0,02 = R$ 1.800  ❌ (aplicou 5% e depois 2%)
```

O correto é multiplicar o **VGV**, não a comissão total:
```ts
r.com_vendedor += val * (percent_vendedor / 100)
// 1.800.000 × 0,02 = R$ 36.000  ✅
```

### Validação com o caso da tela
- VGV = R$ 1.800.000
- Vendedor 2% → **R$ 36.000** (hoje mostra R$ 1.800)
- Captador 1% → **R$ 18.000** (hoje mostra R$ 900)
- HR 2% → **R$ 36.000**
- Soma = R$ 90.000 = `valor_comissao` ✓

## Mudanças

### `src/components/reports/FaturamentoReport.tsx`
Trocar `com` por `val` em 5 linhas:
- Linha 143: `r.com_vendedor += val * ((v.percent_vendedor ?? 0) / 100);`
- Linha 149: `r.com_captador += val * ((v.percent_captador ?? 0) / 100);`
- Linha 114 (KPI HR): `hr += val * ((v.percent_hr ?? 0) / 100);`
- Linha 174: `b.Vendedor += val * ((v.percent_vendedor ?? 0) / 100);`
- Linha 175: `b.Captador += val * ((v.percent_captador ?? 0) / 100);`
- Linha 176: `b.HR += val * ((v.percent_hr ?? 0) / 100);`

A variável `com = v.valor_comissao` deixa de ser usada nesses pontos (continua usada apenas onde realmente queremos a comissão total da venda).

## Sem outras mudanças
- Schema, dados já gravados e o `NovaVendaDialog` (que mostra corretamente R$ 36.000 / R$ 18.000 / R$ 36.000 no preview) ficam como estão.
- Nenhum impacto em VGV total, ticket médio ou contagem de vendas.
