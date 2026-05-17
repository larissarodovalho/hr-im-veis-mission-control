## Objetivo
Exibir o **interesse** do contato dentro do card do Kanban (subabas Carteira e Marketing).

## Mudança (`src/components/contas/ContasKanban.tsx`)
No `ContaCard`, após a linha de telefone/email, renderizar uma `Badge` âmbar (mesmo estilo usado na lista e em `AccountDetail`) com o valor de `a.interesse` quando existir:

```tsx
{a.interesse && (
  <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px]">
    <Target className="h-3 w-3 mr-1" /> {a.interesse}
  </Badge>
)}
```

Importar `Target` de `lucide-react`.

## Fora de escopo
Banco, filtros e demais visualizações.