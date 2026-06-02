## Objetivo

Diferenciar visualmente, na agenda, quem criou cada compromisso atribuindo uma cor fixa por usuário.

## Como vai funcionar

- Cada usuário (`criado_por_id`) recebe uma cor estável, derivada de um hash do `user_id` sobre uma paleta curada (~12 cores HSL definidas no design system).
- A mesma cor é usada onde o compromisso aparece:
  - blocos compactos do calendário (mês/semana) — borda lateral + leve fundo tonalizado;
  - cartões do painel de detalhes do dia — pequeno “pílula” colorida com a inicial do criador, ao lado do título;
  - lista do dia (visão diária) — mesma pílula.
- Compromissos sem criador continuam com o estilo neutro atual.
- Adicionamos uma **legenda discreta** no topo da agenda (“Criado por: ⬤ João  ⬤ Maria …”), listando só os usuários com compromissos visíveis no período exibido.
- Tudo apenas no front; sem mudanças de banco, RLS ou edge functions (o campo `criado_por_id` já está sendo carregado).

## Arquivos

- `src/pages/Schedule.tsx`
  - utilitário `colorForUser(userId)` → retorna um índice/objeto `{ bg, border, text, dot }` baseado em hash;
  - aplicar as classes nos blocos do calendário, nos cartões do dia e na lista;
  - renderizar a legenda no header (apenas usuários presentes no recorte atual).
- `src/index.css` (ou `tailwind.config.ts`)
  - definir ~12 tokens semânticos HSL `--user-color-1..12` (cor sólida + variação clara para fundo), seguindo a paleta do projeto.

## Observações

- Como a paleta é fixa e determinística, a mesma pessoa sempre fica com a mesma cor em qualquer máquina, sem precisar guardar nada no banco.
- Se no futuro quiser “cor escolhida pelo usuário”, basta adicionar uma coluna `cor` em `profiles` e o utilitário passa a preferi-la sobre o hash — mas isso fica fora deste escopo.

## Dúvida (opcional)

Prefere que a cor apareça também como **borda lateral grossa** nos blocos do calendário (mais chamativo) ou só como **pílula com inicial** ao lado do título (mais sutil)? Sigo com **borda lateral + pílula** se nada for dito.
