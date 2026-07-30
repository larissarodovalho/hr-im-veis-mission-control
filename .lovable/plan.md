# Novo funil da aba Leads (HR Imóveis)

## Objetivo

Substituir a visualização principal do funil de Leads (11 colunas) por 4 colunas, escopando a aba Leads em: entrada → pré-atendimento → tentativas → conversa ativa → conversão em conta. Sem tocar em Contas, Oportunidades, Negócios ou Pós-venda.

```text
Novo Lead → Pré-atendimento → Em Contato ──────────→ Conversa Ativa
                                  │                        │
                          tentativas 1-2-3          ┌──────┴───────┐
                          (msg/áudio/ligação,  Conta Cliente   Conta Desclassificada
                           no histórico)       (Marketing ›    (motivo obrigatório)
                                                A contatar)
```

## Estado atual verificado (leituras feitas agora)

**Leads por etapa (banco, total 57):**

| Etapa | Qtd |
|---|---|
| Perdido | 30 |
| Manual de acompanhamento | 10 |
| Permuta | 5 |
| Conversa Ativa | 4 |
| Em Contato | 3 |
| Reunião Agendada | 2 |
| Visita | 2 |
| Proposta | 1 |
| Novo Lead / IA de acompanhamento / Fechado | 0 |

**Fatores técnicos confirmados:**
- `leads.etapa_funil` e `contas.etapa_funil` são `text` livre — sem enum, sem CHECK, sem vínculo rígido. Renomear/reordenar não quebra nada estrutural.
- Entradas de leads (Meta webhook, formulário do site, chat IA, webhook WhatsApp, manual) gravam `"Novo Lead"` — continuam funcionando sem alteração.
- Webhook WhatsApp move automaticamente `Novo Lead → Em Contato` quando o lead responde — compatível com o novo fluxo.
- `MetaLeadAdsTab` usa a constante `STAGES` para "Etapa inicial" — atualiza sozinha quando `STAGES` mudar.
- `interacoes.tipo` tem CHECK que hoje só permite `ligacao, mensagem, visita, reuniao, email, nota` — os inserts atuais de `whatsapp_ia` e `followup_manual` estão fora do CHECK (será corrigido na migração).
- Dashboard e Relatórios não dependem das colunas removidas de forma quebrável (Dashboard conta etapas legadas num KPI, sem erro; Relatórios usam funil de Contas).
- A conversão atual (LeadDetail) já cria conta com `tags=['marketing']`, `etapa_funil='a_contatar'`, migra interações órfãs, vincula `lead_id_origem`, verifica duplicidade e o lead some da aba Leads — será reaproveitada como "Conta Cliente".

## Mudanças

### 1. Migração de banco (não destrutiva)
- `leads.tipo_acompanhamento text` (CHECK: `ia` / `manual` / `corretor`, nulo permitido).
- `leads.motivo_desclassificacao text` (nulo).
- `contas.desclassificada boolean not null default false` + `contas.motivo_desclassificacao text`.
- `interacoes.canal text` (nulo — WhatsApp, ligação, SMS, e-mail).
- Recriar CHECK de `interacoes.tipo` incluindo `audio`, `whatsapp_ia`, `followup_manual` (corrige inserts que hoje falham).
- Backfill: `IA de acompanhamento` → `Em Contato` + `tipo_acompanhamento='ia'` (0 registros hoje); `Manual de acompanhamento` → `Em Contato` + `tipo_acompanhamento='manual'` (10 registros).
- Registros em Reunião/Visita/Proposta/Permuta/Fechado/Perdido: **nenhuma alteração** — permanecem no banco como legado.

### 2. `src/lib/leads.ts`
- `STAGES` passa a ter 4 colunas: Novo Lead, **Pré-atendimento** (nova), Em Contato, Conversa Ativa.
- Novo `LEGACY_STAGES` (rótulos/cores das 7 etapas retiradas) para badges na lista e no detalhe.
- Constantes: `TIPO_ACOMPANHAMENTO` (🤖 IA / 👤 Manual / 🧑‍💼 Corretor), `MOTIVOS_DESCLASSIFICACAO` (Sem interesse, Contato inválido, Cadastro duplicado, Fora do perfil, Fora da região de atuação, Não procura mais imóvel, Solicitou não receber contatos, Spam, Outro), `TENTATIVA_SEQ` (1ª mensagem, 2ª áudio, 3ª ligação).

### 3. Aba Leads (`src/pages/Leads.tsx`)
- Kanban com as 4 colunas (drag-and-drop entre elas, como hoje).
- Card: badge **"Tentativas: X de 3"** (leads em Em Contato, contando interações tipo mensagem/áudio/ligação) e badge de **tipo de acompanhamento** quando presente.
- Leads em etapas legadas não aparecem no Kanban; visão em **Lista** continua mostrando todos (com badge da etapa legada) + filtro "Legados" para consulta rápida.
- Filtro "Precisam nutrição" e botão de follow-up IA passam a valer apenas para as 4 etapas ativas.
- Follow-up manual passa a gravar `tipo_acompanhamento='manual'` no lead.

### 4. Detalhe do lead (`src/pages/LeadDetail.tsx`)
- Seletor de etapa com as 4 etapas ativas; se o lead tiver etapa legada, ela aparece marcada como "(legado)" e pode ser movida para o funil ativo.
- Seção **"Tentativas de contato"** (etapa Em Contato): sequência 1ª mensagem → 2ª áudio → 3ª ligação, cada registro em diálogo com resultado, canal, observação e próxima ação → grava em `interacoes` (aparece na timeline com autor e data/hora). Progresso "Tentativa X de 3".
- Após as tentativas, dois botões:
  - **"Sucesso no contato"**: escolher corretor → define responsável, registra encaminhamento no histórico, move para Conversa Ativa.
  - **"Sem contato"**: escolher corretor → define responsável, cria **tarefa** para o corretor (`tarefas.lead_id`), registra "sequência inicial encerrada sem resposta", lead permanece em Em Contato.
- Botão **"Converter em Conta Cliente"** (fluxo atual renomeado, inalterado na lógica).
- Botão **"Converter em Conta Desclassificada"**: diálogo com motivo obrigatório (select; "Outro" pede texto) → cria conta com `desclassificada=true`, motivo, `lead_id_origem` e `etapa_funil='desclassificada'` (não entra em nenhum funil visível hoje), migra interações, grava motivo também no lead. O lead sai da visão ativa (já ocorre via vínculo). Nada é excluído.

### 5. Integrações (pequenos ajustes)
- `lead-followup-ia`: ao enviar, grava `tipo_acompanhamento='ia'` no lead.
- `meta-leadgen-webhook`: se um mapeamento antigo apontar para etapa removida (IA/Manual de acompanhamento), grava `Em Contato` + `tipo_acompanhamento` correspondente.
- Demais entradas (site, chat IA, WhatsApp, manual): sem alteração — já entram em "Novo Lead" com a origem preservada.

## Fora de escopo (conforme pedido)
- Funis de Contas, Carteira, Marketing, Oportunidades, Negócios e Pós-venda: intocados.
- Nenhum registro, histórico ou relacionamento é apagado; nenhuma migração destrutiva.
- Dashboard e Relatórios: sem alteração (seguem funcionando; leads migrados aparecem em "Em Contato" nos KPIs).

## Relatório final

Ao concluir, entrego relatório com: (1) contagem por etapa antes/depois; (2) colunas mantidas/adicionada/retiradas; (3) registros migrados de IA (0) e Manual (10) de acompanhamento; (4) como os 40 registros legados foram preservados; (5) campos criados/reaproveitados; (6) automações ajustadas; (7) testes (entrada de lead, tentativas, conversões cliente/desclassificada, Kanban, lista legada).

## Detalhes técnicos

- 1 migração SQL: colunas novas em `leads`, `contas`, `interacoes`; CHECK de `interacoes.tipo` recriado; backfill de 2 etapas com `UPDATE ... WHERE etapa_funil = ...`.
- `Stage` type em `leads.ts` vira união das 4 ativas + legadas (tipagem segura para registros antigos).
- Contagem de tentativas no Kanban: 1 query agrupada em `interacoes` (tipos mensagem/áudio/ligação) contada no cliente.
- Conta desclassificada usa `etapa_funil='desclassificada'` + flag booleana — não colide com nenhuma coluna dos funis de Contas (Carteira/Marketing), ficando como dado consultável até o módulo futuro.
- Arquivos: `src/lib/leads.ts`, `src/pages/Leads.tsx`, `src/pages/LeadDetail.tsx`, `supabase/functions/lead-followup-ia/index.ts`, `supabase/functions/meta-leadgen-webhook/index.ts`, 1 migração.