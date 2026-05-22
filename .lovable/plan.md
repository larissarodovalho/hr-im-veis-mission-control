## Objetivo
Padronizar todos os valores em reais para o formato **`R$ 1.800.000,00`** (com separador de milhar `.`, decimal `,` e sempre 2 casas), tanto no CRM quanto no site público.

Hoje cada tela define seu próprio `fmt`/`fmtBRL`, a maioria com `maximumFractionDigits: 0` (sem centavos) e alguns lugares usam abreviações como "R$ 1,8 mi" / "R$ 800 mil".

## Mudanças

### 1. Criar helper único `src/lib/format.ts`
```ts
export const formatBRL = (v: number | string | null | undefined, opts?: { dash?: boolean }) => {
  if (v === null || v === undefined || v === "" || Number.isNaN(Number(v))) {
    return opts?.dash === false ? "R$ 0,00" : "—";
  }
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
```
Exporta também `formatBRLCompact` (opcional, mantém abreviação para sparklines/KPIs muito estreitos — **só será usada se o usuário disser que prefere manter**; ver pergunta no final).

### 2. Substituir todas as definições locais por `formatBRL`
Trocar os `fmt`/`fmtBRL`/inline `toLocaleString(..., currency: 'BRL', maximumFractionDigits: 0)` nos arquivos:

- `src/pages/imoveis/VendidosTab.tsx` — `fmt` + `fmtShort` (KPIs e tabela)
- `src/components/reports/FaturamentoReport.tsx` — `fmtBRL` (KPIs, gráfico tooltip, tabela)
- `src/components/imoveis/ImovelHistoricoDrawer.tsx` — `fmtBRL`
- `src/components/imoveis/NovaVendaDialog.tsx` — `fmt` interno
- `src/components/contas/ContasKanban.tsx`
- `src/pages/Imoveis.tsx` — `fmt`
- `src/pages/Accounts.tsx` / `src/pages/AccountDetail.tsx`
- `src/pages/imoveis/OportunidadesTab.tsx` — `fmt`
- `src/components/contratos/NovoContratoDialog.tsx` — `valor_numero` (manter 2 casas, já está ok; ajustar para usar helper)
- `src/lib/contratos.ts` — `formatBRL`/`formatNumber` passam a delegar ao helper central

### Site público
- `src/pages/site/HomePage.tsx` — `formatPrice`
- `src/pages/site/ImoveisPage.tsx` — `formatPrice`
- `src/pages/site/ImovelDetalhePage.tsx` — `formatPrice`

Todos passam a chamar `formatBRL`, resultando em **"R$ 1.800.000,00"** nos cards, página de detalhe e listagens.

### 3. Não alterar
- Campos `m²` (área) continuam com `toLocaleString("pt-BR")` puro.
- Inputs de digitação de valor (`Input type="number"`) — só a exibição muda, não o input.
- Datas/horas e o `toLocaleString` de "última sync" em `Integracoes.tsx`.

## Detalhe técnico
- Helper único evita drift futuro. Cada chamada vira `formatBRL(n)` ou `formatBRL(n, { dash: false })` quando quisermos "R$ 0,00" em vez de "—".
- Sem mudanças de schema, sem mudanças de queries.

## Pergunta antes de implementar
Nos cartões de KPI da aba **Vendidos** (e em algum gráfico), hoje usamos abreviação tipo **"R$ 1,80 mi"** para caber no card. Como você quer?
1. **Mostrar tudo completo** sempre — `R$ 1.800.000,00` (pode ficar apertado em telas pequenas, mas é uniforme).
2. **Manter abreviação só nos KPIs/sparklines** (R$ 1,80 mi / R$ 800 mil) e usar `R$ 1.800.000,00` em tabelas, detalhes e site.

Me diga 1 ou 2 e eu implemento.
