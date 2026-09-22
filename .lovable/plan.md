# Remover o bloco "Auditoria · Pontos para revisão da gestão" do Acompanhamento

## Objetivo
Excluir do relatório de Acompanhamento o item "Auditoria — Pontos para revisão da gestão" (KPIs de oportunidades futuras, etapas antigas e responsáveis divergentes, e a tabela de divergências). Nada mais muda — as seções 01, 02, 03 e 05 permanecem intactas, e a coluna "Divergência de responsável" do CSV/Conta a conta também permanece.

## Alterações

### Tela — `src/components/reports/AcompanhamentoCorretoresReport.tsx`
- Remover o `<Card>` inteiro de linhas 629–653 (bloco "Auditoria" / "Pontos para revisão da gestão" com os três `<Kpi>` e a tabela de `dados.divergencias`).
- `dados.divergencias` deixa de ser referenciado na tela (permanece no tipo e no CSV da seção 05, que usa `c.divergencias_responsabilidade` por conta — não remover o campo do tipo nem da exportação).

### PDF — `src/lib/acompanhamentoPdf.ts`
- Remover o bloco de linhas 501–505: `tituloSecao("Auditoria", "Pontos para revisão da gestão", …)` e os três `texto(…)` seguintes.
- Remover o bloco de linhas 523–530: `tituloSecao("Auditoria", "Divergências Conta × Oportunidade", …)` e a `tabela(…)` de divergências (espelho do card removido da tela).

## Validação
- `bunx tsgo --noEmit`
- `bunx vitest run src/test/acompanhamentoPdf.test.ts`
- `cat /tmp/observability/build-errors.log`
- Playwright em `/crm/relatorios` → aba Acompanhamento: confirmar que as seções 01, 02, 03 e 05 continuam presentes e que o bloco "Pontos para revisão da gestão" sumiu; gerar o PDF e confirmar a ausência das duas seções de Auditoria.
