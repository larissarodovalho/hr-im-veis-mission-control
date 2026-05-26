## Objetivo

Reorganizar a aba **Agenda** (`/crm/agenda`) para um layout mais amplo: calendário grande ocupando toda a largura no topo, com indicadores visuais de compromissos, e abaixo duas colunas lado a lado mostrando "Dia selecionado" e "Próximos compromissos".

## Mudanças (somente UI, em `src/pages/Schedule.tsx`)

1. **Trocar o grid principal** (linha 562) de `lg:grid-cols-[auto_1fr]` para uma estrutura vertical:
   - Topo: card único de largura total com o calendário em tamanho grande.
   - Abaixo: grid `lg:grid-cols-2` com "Dia selecionado" à esquerda e "Próximos" à direita. Bloqueios viram uma terceira seção colapsável/abaixo (ou aba secundária dentro do card de "Dia").

2. **Calendário maior** — Passar `numberOfMonths={2}` (semana + visão mensal ampla) em telas grandes e aumentar a escala via classes customizadas (`cell` e `day` maiores, ex.: `h-12 w-12`, `text-base`), mantendo responsividade. Em telas pequenas, volta para 1 mês.

3. **Remover Tabs** — Substituir o `<Tabs>` por dois `<Card>` separados lado a lado com títulos "Dia selecionado — {data}" e "Próximos compromissos". Bloqueios passam a aparecer:
   - Dentro do card "Dia selecionado" quando houver bloqueios no dia.
   - Em um card adicional abaixo dos dois ("Bloqueios cadastrados") visível só se houver bloqueios ou para admin.

4. **Listas mantidas** — Mesma estrutura de itens (ícone, hora, título, lead, badge status, botão editar). Apenas o container muda.

```text
┌─────────────────────────────────────────────────┐
│              Calendário (2 meses)               │
│              células maiores                    │
└─────────────────────────────────────────────────┘
┌──────────────────────┬──────────────────────────┐
│  Dia selecionado     │   Próximos compromissos  │
│  • 09:00 Reunião…    │   • 28/05 14:00 Visita…  │
│  • 11:30 Ligação…    │   • 30/05 10:00 Ligação… │
└──────────────────────┴──────────────────────────┘
┌─────────────────────────────────────────────────┐
│  Bloqueios cadastrados (se houver)              │
└─────────────────────────────────────────────────┘
```

## Não muda

- Lógica de busca, edição, criação, bloqueios, sync Google Calendar.
- Dialogs de novo compromisso, bloqueio e edição.
- Permissões.
