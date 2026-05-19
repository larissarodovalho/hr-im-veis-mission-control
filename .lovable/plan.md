## Adicionar coluna "Captação/Imóvel" no Kanban de Contas

Nova etapa do funil que aparece como coluna no Kanban e nos relatórios, válida tanto na lista Carteira quanto na Marketing (o filtro de lista é por tag, independente da etapa, então a nova coluna aparece automaticamente nas duas abas).

### Onde mudar

1. **`src/lib/contasFunil.ts`** — fonte única do funil.
   - Adicionar `"captacao_imovel"` ao tipo `EtapaFunil`.
   - Adicionar entrada no array `ETAPAS` com label "Captação/Imóvel" e cor própria (ex.: fuchsia/rose — distinta das já usadas). Posição sugerida: entre `contato_estabelecido` e `reuniao` (faz sentido no fluxo: já houve contato → estamos captando o imóvel → reunião/visita).

2. **`src/components/reports/FunilContasReport.tsx`** — relatório do funil.
   - Adicionar `"captacao_imovel"` ao array `FLUXO` (para entrar no cálculo acumulado e na taxa de avanço) na mesma posição.
   - Adicionar cor correspondente no objeto `COLORS`.

### O que NÃO precisa mudar

- **Banco**: `contas.etapa_funil` é `text` livre, sem CHECK/enum. Nada para migrar.
- **`ContasKanban.tsx`**: já itera sobre `ETAPAS` dinamicamente — a coluna aparece sozinha.
- **Filtro Carteira/Marketing**: é por tag, ortogonal à etapa. A nova coluna aparece nas duas listas automaticamente.
- **`Accounts.tsx` / `AccountDetail.tsx`**: usam `etapaLabel`/`ETAPAS` dinamicamente.

### Confirmações rápidas

- Label exato: **"Captação/Imóvel"** (com barra)? Ou prefere "Captação de imóvel"?
- Posição no fluxo: entre **Contato estabelecido** e **Reunião** — ok? (Alternativa: logo após "A contatar", se captação for o ponto de entrada).
