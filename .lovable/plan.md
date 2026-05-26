## Objetivo

Transformar a aba Agenda em um **calendário mensal estilo Notion/Google Calendar** (como na imagem): grade do mês inteiro com os compromissos visíveis dentro de cada célula do dia. Abaixo, mantém o detalhamento do dia selecionado e próximos compromissos.

## Mudanças (somente `src/pages/Schedule.tsx`)

### 1. Substituir `<Calendar>` (react-day-picker) por uma grade mensal customizada

O DayPicker atual não comporta listar eventos dentro das células. Vou construir um componente local `MonthGrid` que renderiza:

- Header com mês/ano + botões «‹ Hoje ›» (navegação por `currentMonth` state).
- Linha de cabeçalho dos dias da semana: `dom. seg. ter. qua. qui. sex. sáb.`
- Grade 7 colunas × (5–6 linhas) cobrindo o mês completo (incluindo dias do mês anterior/próximo em cinza).
- Cada célula:
  - Número do dia no topo (badge vermelho circular quando é hoje, como na referência).
  - Lista vertical com até 4 compromissos do dia: barra colorida lateral por tipo + título truncado + hora à direita.
  - "+ N mais" quando houver mais.
  - Bloqueios renderizados como faixa de fundo vermelha clara (`bg-destructive/10`) ocupando o dia inteiro.
  - Clique na célula → `setSelected(dia)` e rola para a seção de detalhes.
  - Clique num evento específico → também seleciona o dia + abre edição (`openEdit`).
- Célula selecionada com leve destaque (`ring-1 ring-primary/40`).

Cores por tipo (usando tokens):
- `ligacao` → barra `bg-warning`
- `presencial` → barra `bg-success`
- `videochamada` → barra `bg-accent`

### 2. Layout da página

```text
┌─────────────────────────────────────────────────────┐
│  maio de 2026                          ‹ Hoje ›    │
│  ─────────────────────────────────────────────────  │
│  dom | seg | ter | qua | qui | sex | sáb           │
│  ┌───┬───┬───┬───┬───┬───┬───┐                     │
│  │26 │27 │28 │29 │30 │ 1 │ 2 │   ← cada célula     │
│  │•  │•  │•  │•  │•  │•  │•  │     com eventos     │
│  └───┴───┴───┴───┴───┴───┴───┘                     │
│  ... 5–6 linhas ...                                 │
└─────────────────────────────────────────────────────┘
┌───────────────────────┬─────────────────────────────┐
│  Dia selecionado      │   Próximos compromissos     │
│  (detalhes completos) │   (lista futura)            │
└───────────────────────┴─────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  Bloqueios cadastrados (se houver)                  │
└─────────────────────────────────────────────────────┘
```

### 3. Estado e lógica novos

- `currentMonth: Date` para navegar entre meses.
- Helpers locais: `startOfMonth`, `endOfMonth`, `startOfWeek`, `addDays`, `isSameMonth` (já uso `date-fns`, é só importar).
- Mapa `eventsByDay: Map<string, Compromisso[]>` (chave `yyyy-MM-dd`) memoizado, para lookup O(1) por célula.
- Mesma `Map` para bloqueios expandidos.

### 4. Não muda

- Toda a lógica de fetch, criar, editar, bloquear, sync Google Calendar.
- Dialogs (`openNovo`, `openBloqueio`, `editing`).
- Permissões.
- Cards "Dia selecionado" e "Próximos compromissos" abaixo (já feitos no layout anterior).

## Detalhes técnicos

- Sem nova dependência — uso `date-fns` que já está no projeto.
- Altura mínima das células: `min-h-[110px]` no desktop, `min-h-[80px]` no mobile.
- Mobile: grade vira mais compacta (mostra só 2 eventos + "+N").
- Acessibilidade: cada célula é `<button>` com `aria-label` da data.
