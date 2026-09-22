# Remover a seção "Três leituras" (04 · O que fazer) do Acompanhamento

## Objetivo
Excluir do Acompanhamento dos corretores o bloco "04 · O que fazer / Três leituras", que apresenta os três textos gerados ("Onde o funil falha", "É do escritório ou de um corretor?", "Prazo é o sintoma comum"). Nada mais muda.

## Alterações

### Tela — `src/components/reports/AcompanhamentoCorretoresReport.tsx`
- Remover o bloco `{/* 04 Leituras */}` (Card com "04 · O que fazer" e as três `<Leitura>`).
- Remover a função `Leitura` (linhas ~938-946), que fica sem uso.
- Remover variáveis usadas só pelas leituras se ficarem sem referência (ex.: `piorCorretor`, `pct` se não for mais usado). `pct` é usado na seção 03, então permanece; verificar `piorCorretor` e `t.dias_medios_travadas` antes de excluir.

### PDF — `src/lib/acompanhamentoPdf.ts`
- Remover `tituloSecao("04 · O que fazer", "Três leituras")` e os quatro `texto(...)` seguintes (linhas ~502-506), incluindo a linha de "Auditoria" que estava agregada nesse bloco — reavaliar se a linha de Auditoria deve migrar para outro lugar ou sair junto.

## Validação
- Typecheck (`tsgo`).
- `bunx vitest run src/test/acompanhamentoPdf.test.ts`.
- `npm run build`.
- Playwright: abrir `/crm/relatorios` → aba Acompanhamento, confirmar que a seção 03 (Taxa de incidência) ainda aparece e que o bloco "Três leituras" sumiu; gerar o PDF e confirmar a ausência da seção 04.
