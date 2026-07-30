# Novo funil da aba Leads — IMPLEMENTADO

Data: 08/06/2026. Escopo: exclusivamente a aba Leads. Funis de Contas, Oportunidades e demais áreas não foram alterados.

## Estrutura nova (visualização principal)

```text
Novo Lead → Pré-atendimento → Em Contato → Conversa Ativa
                                                    ├─ Converter em Conta Cliente → Contas › Marketing › A contatar
                                                    └─ Converter em Conta Desclassificada (motivo obrigatório)
```

- Em Contato: sequência de tentativas (1ª mensagem → 2ª áudio → 3ª ligação) registrada no histórico, com resumo "Tentativas: X de 3" no card. Desfechos: "Sucesso no contato" (define corretor → Conversa Ativa) e "Sem contato" (define corretor + cria tarefa, lead permanece em Em Contato).
- IA/Manual deixaram de ser etapas: viraram o campo `tipo_acompanhamento` (ia | manual | corretor), exibido como badge no card.
- Etapas comerciais (Reunião Agendada, Visita, Proposta, Permuta, Fechado, Perdido) saíram da visualização principal e ficam como LEGADO: registros preservados no banco, acessíveis na visão de lista com o escopo "Somente legado", sem exclusões.

## Relatório final

1. **Leads por etapa ANTES da alteração** (57 no total):
   - Novo Lead: 0 · Em Contato: 3 · Conversa Ativa: 4
   - IA de acompanhamento: 0 · Manual de acompanhamento: 10
   - Reunião Agendada: 2 · Visita: 2 · Proposta: 1 · Permuta: 5 · Fechado: 0 · Perdido: 30
2. **Colunas mantidas**: Novo Lead, Em Contato, Conversa Ativa.
3. **Coluna adicionada**: Pré-atendimento.
4. **Retiradas da visualização principal**: IA de acompanhamento, Manual de acompanhamento, Reunião Agendada, Visita, Proposta, Permuta, Fechado, Perdido.
5. **Migrados de "IA de acompanhamento"**: 0 (coluna já estava vazia).
6. **Migrados de "Manual de acompanhamento"**: 10 → "Em Contato" com `tipo_acompanhamento = 'manual'`.
7. **Preservação dos registros comerciais**: nenhuma linha alterada ou apagada; as 40 leads em etapas legadas (Reunião 2, Visita 2, Proposta 1, Permuta 5, Perdido 30) ficam fora do Kanban e visíveis na lista (escopo "Somente legado"); no detalhe do lead, a etapa legada aparece no seletor marcada como "(legado)".
8. **Campos criados/reaproveitados**:
   - `leads.tipo_acompanhamento` (ia | manual | corretor) — novo
   - `leads.motivo_desclassificacao` — novo
   - `contas.desclassificada`, `contas.motivo_desclassificacao`, `contas.desclassificada_em`, `contas.desclassificada_por` — novos
   - `interacoes.tipo`: CHECK ampliado com `audio`, `whatsapp_ia`, `followup_manual` (tipos anteriores mantidos)
9. **Automações modificadas**:
   - `lead-followup-ia`: follow-up por IA agora marca `tipo_acompanhamento = 'ia'` no lead
   - Follow-up manual pelo Kanban: marca `tipo_acompanhamento = 'manual'`
   - `meta-leadgen-webhook`: se um mapeamento antigo apontar para etapa de acompanhamento, o lead entra em "Em Contato" com o tipo correspondente
   - Entradas de leads (site, Meta, chat IA, manual) continuam em "Novo Lead" — sem alteração
10. **Testes realizados**: typecheck limpo; contagem pós-migração conferida no banco (10 migrados, 40 legados intactos); verificação visual no navegador do Kanban (4 colunas + badges de tentativas), do detalhe do lead (card de tentativas, botões de desfecho) e do diálogo "Registrar tentativa".

## Arquivos alterados

- `src/lib/leads.ts` — STAGES (4 ativas), LEGACY_STAGES, TENTATIVA_SEQ, INTERACAO_CANAIS, TENTATIVA_RESULTADOS, MOTIVOS_DESCLASSIFICACAO, ACOMPANHAMENTO_META, isLegacyStage, stageLabel
- `src/pages/Leads.tsx` — Kanban de 4 colunas, badge "Tentativas: X de 3", badge de acompanhamento, escopo de lista (Todos/Funil ativo/Somente legado)
- `src/pages/LeadDetail.tsx` — card "Tentativas de contato", diálogos de tentativa/sucesso/sem contato/desclassificação, botão "Conta Cliente", seletor de etapa com legados bloqueados
- `src/hooks/useLeads.ts` — novos campos no tipo
- `supabase/functions/lead-followup-ia/index.ts`, `supabase/functions/meta-leadgen-webhook/index.ts` — redeploy feito
- Migração: `20260608190000_leads_funil_restructure.sql`

## Próximos passos (fora deste escopo)

- Funil de Oportunidades e Negócios (Reunião, Visita, Proposta, Permuta, Fechado) — módulo futuro que absorverá as etapas legadas.
- Tratamento visual de contas desclassificadas na aba Contas (hoje ficam em "A contatar" com tag `desclassificado`).
