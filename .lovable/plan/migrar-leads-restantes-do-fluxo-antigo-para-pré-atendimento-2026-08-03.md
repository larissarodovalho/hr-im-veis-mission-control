# Migrar leads restantes do fluxo antigo para Pré-atendimento e aposentar a classificação "legado"

## Diagnóstico
Restam **5 leads** em etapas do fluxo antigo: 2 em "Reunião Agendada", 2 em "Visita" e 1 em "Proposta". Todos os 5 **já foram convertidos em Conta** — por isso não aparecem no Kanban, mas continuam aparecendo como "legados" na visão Lista e mantêm o chip "em etapas legadas" no topo da página Leads.

## O que será feito

### 1. Banco de dados (migração)
- Mover todos os leads das etapas antigas (IA de acompanhamento, Reunião Agendada, Visita, Proposta, Fechado) para **Pré-atendimento** (5 leads afetados).
- Como todos já são convertidos, eles continuam ocultos no Kanban (a Conta correspondente é o registro ativo) — mas a base fica 100% dentro do funil atual.

### 2. Código — aposentar a classificação "legado" do módulo Leads
- **src/lib/leads.ts**: remover `LegacyStage`, `LEGACY_STAGES` e `isLegacyStage`; o tipo `Stage` passa a ser apenas as 5 etapas ativas.
- **src/pages/Leads.tsx**: remover o chip "em etapas legadas", a opção "Somente legados" do filtro da lista, o seletor de escopo (todas/funil — fica redundante), os sufixos "(legado)" nos badges de etapa e o bloqueio de follow-up IA baseado em etapa legada.
- **src/pages/LeadDetail.tsx**: remover a exibição da etapa legada no seletor de etapa (passa a listar só as 5 etapas ativas).
- **src/pages/Dashboard.tsx**: remover as etapas antigas do conjunto usado no KPI "em atendimento".

### 3. Validação
- Confirmar no banco que não existe mais nenhum lead fora das 5 etapas do funil atual.
- Verificar no preview: chip de legados desaparece, lista sem sufixos "(legado)" e Kanban inalterado (5 colunas).

## Fora de escopo
- As etapas legadas do funil de **Contas** (`isEtapaLegado` em contasFunil.ts) e o painel de migração de oportunidades legadas não são afetados.
- O histórico de interações que menciona nomes de etapas antigas permanece como registro histórico.
