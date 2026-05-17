Causa: a coluna `interacoes.tipo` tem CHECK constraint que só aceita `ligacao`, `mensagem`, `visita`, `reuniao`, `email`, `nota`. Meu componente está inserindo "Reunião", "Ligação", etc. (com acento e maiúscula), por isso o insert falha.

Correção em `src/components/contas/ContaInteracoesTimeline.tsx`:

- Alterar o array `TIPOS` para usar `{ value, label, icon, color }` com `value` correspondendo ao slug aceito pelo banco e `label` para exibição:
  - `reuniao` → "Reunião"
  - `ligacao` → "Ligação"
  - `mensagem` → "WhatsApp / Mensagem"
  - `email` → "Email"
  - `visita` → "Visita"
  - `nota` → "Nota / Interesse"
- `useState` inicial: `"reuniao"` em vez de `"Reunião"`.
- `<SelectItem value={t.value}>{t.label}</SelectItem>`.
- Badge da timeline: usar `meta.label` em vez de `it.tipo` cru.
- `tipoMeta` lookup permanece por `value`.

Nenhuma alteração no banco — somente código frontend.