# Fluxo de atendimento do lead: visível desde a chegada + painel de acompanhamento

## Objetivo
O fluxo de 3 tentativas (💬 mensagem imediata na entrada, 🎧 áudio em +24h, 📞 ligação em +48h) já existe, mas só aparece na etapa "Em Contato". Duas melhorias:

1. **Mostrar o fluxo desde a chegada do lead** — o relógio do SLA já começa na entrada do lead (`data_entrada`); a visualização passa a acompanhar isso.
2. **Painel de acompanhamento** — visão consolidada na aba Leads para monitorar o atendimento de todos os leads de uma vez.

## Estado atual (confirmado)
- `src/pages/LeadDetail.tsx:769` — card "Tentativas de contato" renderiza só quando `etapa_funil === "Em Contato"`.
- `src/pages/Leads.tsx` — `TentativasTags` (linha 358) também retorna vazio fora de "Em Contato" (linha 359), e o `load()` (linha 87) só busca interações de leads em "Em Contato".
- Realtime já recarrega em mudanças de `interacoes`, `leads` e `tarefas` — nada a mudar aqui.
- A página Leads tem 2 visões (Kanban / Lista) em `Tabs` (linhas ~190-197).

## Mudanças

### 1. Fluxo visível desde a chegada (LeadDetail.tsx)
- Ampliar a condição do card para as etapas ativas pré-conversão: **Novo Lead, Pré-atendimento e Em Contato** (continua oculto quando o lead virou conta, está em Conversa Ativa ou Perdido).
- Renomear o título do card para **"Fluxo de atendimento"** (mantendo o subtítulo das tentativas), alinhando com a linguagem do usuário.

### 2. Tags do cronograma desde a chegada (Leads.tsx)
- `TentativasTags` e `LeadCard`: mesma condição ampliada (3 etapas ativas) — as 3 mini-tags passam a aparecer no card do funil e na lista assim que o lead cai.
- `load()`: buscar as interações de tentativa para leads nas 3 etapas ativas (hoje só "Em Contato"), sem consulta extra por lead.

### 3. Nova visão "Atendimento" na página Leads (painel de acompanhamento)
- Terceira opção no seletor de visão (ícone de headset/telefone), ao lado de Kanban e Lista.
- Conteúdo do painel (apenas leads ativos não convertidos):
  - **Chips-resumo clicáveis** no topo: `Sem nenhuma tentativa` · `Atrasados` · `No prazo` · `Fluxo concluído (3/3)` — cada um filtra a lista ao clicar.
  - **Lista ordenada por urgência** (tentativa atrasada primeiro): nome do lead (link para o detalhe), etapa, responsável, as 3 mini-tags do cronograma (reuso do `TentativasTags`) e o countdown da próxima tentativa.
  - Reaproveita os dados já carregados (`tentativasMap`, `brokers`) — sem novas consultas.

## Fora de escopo
- Nenhuma automação de envio (WhatsApp automático), nenhuma mudança nas regras de SLA (1ª imediata / áudio +24h / ligação +48h), nenhuma migração de banco.

## Validação
- Lead recém-criado em "Novo Lead" → card do funil já mostra `💬 Msg` com countdown e o detalhe exibe o "Fluxo de atendimento".
- Registrar tentativa no detalhe → tag vira ✓ verde no funil e no painel, em tempo real.
- Painel "Atendimento" → chips filtram corretamente; ordenação coloca atrasados no topo.
- Typecheck sem erros.

## Detalhes técnicos
- Arquivos: `src/pages/LeadDetail.tsx` (condição + título do card) e `src/pages/Leads.tsx` (condição das tags, `load()`, nova visão `atendimento` no estado `view`).
- Constante compartilhada local: `ETAPAS_FLUXO_ATENDIMENTO = ["Novo Lead", "Pré-atendimento", "Em Contato"]` em `src/lib/leads.ts` para manter as condições sincronizadas entre os dois arquivos.
- Classificação do painel reutiliza `tentativaStatus` / `prazoCountdown` de `src/lib/leads.ts` (sem duplicar regra de SLA).
