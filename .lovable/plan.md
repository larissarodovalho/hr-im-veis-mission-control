# Cronograma de tentativas (1ª/2ª/3ª) visível no card do lead no funil

## Objetivo
Mostrar o cronograma das 3 tentativas de contato (mensagem imediata, áudio +24h, ligação +48h) como **tags no card do lead no Kanban da aba Leads** — hoje o card mostra só uma tag com a próxima tentativa; o usuário quer ver o andamento das três de relance, como já aparece no detalhe do lead.

## Estado atual (confirmado)
- `src/pages/Leads.tsx` → `LeadCard` (linhas 378-394): exibe **apenas uma** tag da próxima tentativa pendente (ou "Tentativas: 3 de 3"), somente quando `etapa_funil === "Em Contato"`.
- `Leads.tsx` já busca a contagem de tentativas por lead (`tentativasCount`, consulta em `interacoes` com tipos mensagem/audio/ligacao) — suficiente para saber quantas foram feitas.
- O detalhe do lead (`LeadDetail.tsx`, linhas 769-826) já tem o card "Tentativas de contato" com as 3 pílulas completas (feita ✓ com pontualidade / próxima com countdown / futura esmaecida) — é o modelo visual a espelhar em versão compacta.
- Helpers prontos em `src/lib/leads.ts`: `TENTATIVA_SEQ`, `TENTATIVA_EMOJI`, `prazoCountdown`, `TENTATIVA_TONE_CLASS`.

## Mudanças

### 1. `src/pages/Leads.tsx` — tags do cronograma no `LeadCard`
- Substituir a tag única de tentativa por **3 mini-tags** (uma por tentativa), visíveis quando o lead está em "Em Contato":
  - **Feita**: tag verde com ✓ + emoji + label (ex.: `✓ 💬 Msg`), tooltip com "registrada".
  - **Próxima pendente**: tag com countdown (`💬 Msg: vence em 5h` / `📞 Ligação: atrasada há 2d`), tom âmbar/vermelho conforme `prazoCountdown`, com pulso quando atrasada.
  - **Futura**: tag esmaecida (muted) com o prazo relativo (ex.: `📞 Ligação: +48h`).
- Tooltip em cada tag com o prazo exato (`prazoDataLabel`) e, para as feitas, a data de registro — para isso a consulta de tentativas passa a trazer também `tipo` e `created_at` (hoje traz só `lead_id`), permitindo montar o mapa de tentativas por lead sem consulta extra.

### 2. Visão em lista (mesma página)
- Na tabela da visão Lista, exibir as mesmas 3 mini-tags na linha do lead (coluna de badges existente), mantendo Kanban e Lista consistentes.

### 3. Realtime
- A página já recarrega em mudanças de `leads` e `tarefas`; incluir o canal de `interacoes` no refetch da contagem de tentativas para a tag atualizar em tempo real quando uma tentativa é registrada no detalhe.

## Fora de escopo
- Nenhuma mudança no detalhe do lead (já tem o cronograma completo), nenhuma migração de banco, nenhuma mudança nas regras de SLA.

## Validação
- Lead em "Em Contato" recém-criado → card mostra `💬 Msg` com countdown "fazer agora/vence em…", `🎧 Áudio` e `📞 Ligação` esmaecidos.
- Registrar uma tentativa no detalhe → tag correspondente vira ✓ verde no card do funil.
- 3 tentativas feitas → as 3 tags verdes (ou selo "3 de 3" se preferir manter compacto).
- Typecheck sem erros.
