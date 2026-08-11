# Distribuição de Carteira — Fase 4: Automação e alertas de SLA

As fases 1 a 3 (distribuição em lotes, atendimento do corretor e relatórios/auditoria) já estão no ar. Hoje o sistema registra prazos, mas ninguém é avisado quando eles estouram: o gestor precisa abrir a tela de Acompanhamento para descobrir atrasos, e contas paradas ficam presas com o corretor indefinidamente.

Esta fase fecha esse ciclo com automação diária e avisos.

## O que será entregue

### 1. Rotina diária automática (roda de madrugada, horário de Cuiabá)
- Marca como "atrasada" toda atribuição cujo prazo de primeiro contato venceu sem nenhuma tentativa registrada.
- Devolve automaticamente para o pool do gestor as contas sem qualquer atividade após um limite configurável (padrão: 7 dias corridos após o prazo), registrando o motivo "devolução automática por inatividade" na linha do tempo.
- Cria alerta para contas com contato estabelecido mas sem próxima ação agendada há mais de 5 dias.
- Todos os eventos ficam gravados no histórico imutável da conta (mesma auditoria da Fase 3).

### 2. Parâmetros configuráveis
Nova seção em Configurações (visível para admin/gestor) com:
- dias até a devolução automática;
- dias sem próxima ação para gerar alerta;
- ligar/desligar a devolução automática;
- ligar/desligar os e-mails de resumo.

### 3. Avisos por e-mail
- Resumo diário para cada corretor com atribuições atrasadas ou com ação vencida (só envia se houver pendência).
- Resumo diário para gestores/admin com total de atrasos por corretor, devoluções automáticas do dia e solicitações pendentes de aprovação.
- Respeita a lista de e-mails suprimidos já existente.

### 4. Central de alertas nas telas
- "Minha Carteira": faixa no topo com contagem de contas atrasadas e de ações vencidas, com filtro rápido.
- "Acompanhamento" (gestor): destaque para lotes com atraso acima de 30% e lista de devoluções automáticas recentes.
- Dashboard: cartão "Carteira" com atrasos e solicitações pendentes, visível para admin/gestor.

## Detalhes técnicos

- Migração: tabela `carteira_config` (linha única, com grants e RLS restrita a admin/gestor para escrita e leitura autenticada) e função `carteira_rotina_diaria()` em `SECURITY DEFINER`, que aplica marcação de atraso, devolução automática (reutilizando a lógica de `carteira_gestor_acao`) e geração de eventos.
- Agendamento via `pg_cron` chamando a rotina às 06:10 UTC (02:10 Cuiabá) e uma edge function `carteira-daily-digest` disparada em seguida para os e-mails (Resend, mesmo remetente das notificações atuais).
- Novas funções de leitura: `carteira_alertas_corretor()` e `carteira_alertas_gestor()` para alimentar as faixas de alerta sem consultas pesadas no cliente.
- Frontend: `src/hooks/useCarteira.ts` ganha os hooks de alertas e config; novos componentes `src/components/carteira/CarteiraAlertas.tsx` e `src/components/carteira/CarteiraConfigDialog.tsx`; integrações em `MinhaCarteira.tsx`, `AcompanhamentoCarteira.tsx`, `Dashboard.tsx` e `ConfiguracoesPage.tsx`.
- Todos os cálculos de data usam os helpers de `src/lib/datetime.ts` (America/Cuiaba).
