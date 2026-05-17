## Objetivo
Adicionar uma nova coluna **Visita** ao Kanban do funil de contas (usado em Carteira e Marketing).

## Mudança (`src/lib/contasFunil.ts`)
Adicionar `"visita"` ao tipo `EtapaFunil` e ao array `ETAPAS`, posicionada entre **Reunião** e **Fechado** (ordem natural do funil):

```ts
{ id: "visita", label: "Visita", color: "bg-teal-500/15 text-teal-700 border-teal-500/30" }
```

A coluna é renderizada automaticamente pelo `ContasKanban` (que itera `ETAPAS`), e o drag-and-drop já aceita qualquer `EtapaFunil`. Contas existentes continuam nas suas etapas atuais; a nova coluna aparece vazia até alguém mover um card para ela.

## Fora de escopo
Banco (a coluna `etapa_funil` é `text` livre, sem constraint), filtros e demais visualizações.