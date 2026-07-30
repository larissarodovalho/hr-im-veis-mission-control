# Etapa 3 da reestruturação: Módulo Oportunidades de Negócio

## Estado atual verificado (levantamento prévio)

- **30 oportunidades** existentes: 23 vinculadas a Contas, **7 somente a Leads** (3 em Nova, 4 em Buscando).
- Por etapa: nova 9, buscando 12, visita 4, proposta 3, ganha 2, perdida 0.
- Constraint `oportunidades_estagio_check` = `('nova','buscando','visita','proposta','ganha','perdida')`. **O valor interno de "Em proposta" já é `proposta`** — a renomeação para "Proposta" é puramente visual (rótulo), sem migração de constraint. Nenhuma constraint será alterada ou excluída.
- RLS já é escopada: corretor vê/edita só as próprias (corretor_id/created_by), admin vê tudo. Será ampliada para incluir **gestor**.
- Fechamento já existe em duas estruturas: `conta_fechamentos` (simples) e `vendas` + `NovaVendaDialog` (comissões). A integração usará essas estruturas — nenhum sistema paralelo.
- `tarefas` e `interacoes` **não têm** `oportunidade_id` (será adicionado).
- Contas em etapas legadas aguardando este módulo: captação/imóvel 36, reunião 16, fechado 12, visita 5, proposta 3, permuta 1.

## 1. Migração SQL (não destrutiva, idempotente)

**Tabela `oportunidades` — novas colunas (todas nullable):**
- `conta_id` (uuid) — vínculo principal com a Conta; `lead_id_origem` (uuid) — lead de origem histórico.
- `categoria_origem` ('carteira'/'marketing') — snapshot histórico no momento da criação.
- `origem` (text) — origem específica (campanha/formulário).
- Diagnóstico: `forma_pagamento`, `prazo_pretendido`, `possui_permuta` (bool), `imovel_permuta` (text), `valor_estimado_permuta`, `caracteristicas_indispensaveis`, `data_diagnostico`, `diagnostico_por`.
- Fechamento: `valor_final`, `data_fechamento`, `imovel_fechamento_id`, `proposta_aceita_id`.
- Perda: `motivo_perda`, `obs_perda`, `destino_conta_perda`, `encerrada_em`, `encerrada_por`.
- `estagio_desde` (timestamptz) — para "tempo na etapa".

**Backfill:** preencher `conta_id`/`lead_id_origem` a partir de `cliente_tipo`/`cliente_id`; para as 7 oportunidades lead-only, tentar casar `contas.lead_id_origem = cliente_id`. As que não casarem ficam marcadas como **"Vínculo pendente de revisão"** na UI (nada é excluído; `cliente_tipo`/`cliente_id` permanecem). `conta_id` NÃO vira NOT NULL nesta etapa.

**Tabela `oportunidade_imoveis` — novas colunas:** `apresentado_em`, `apresentado_por`, `feedback_cliente`, `motivo_rejeicao`, `status` ('vinculado','apresentado','rejeitado'), `created_by`.

**Novas tabelas (com GRANTs e RLS espelhando as políticas de `oportunidades`):**
- `oportunidade_visitas`: imóvel, data/horário, corretor, local, observação, status ('agendada','confirmada','realizada','cancelada','reagendada','nao_compareceu'), e pós-visita (interesse, feedback, pontos positivos, objeções, próxima ação).
- `oportunidade_propostas`: imóvel, valor pedido/proposto, forma de pagamento, entrada, parcelamento, financiamento, prazos, condições, validade, permuta (bool + imóvel + valor), observações, status ('em_preparacao','enviada','em_analise','contraproposta','aceita','recusada','expirada','cancelada'). Histórico imutável (sem sobrescrever).

**Vínculos novos:** `oportunidade_id` em `interacoes` (linha do tempo), `tarefas` (próxima ação) e `conta_fechamentos` (ponte com fechamento).

**RLS:** incluir gestor na leitura/escrita junto do admin; corretor continua vendo só as suas.

## 2. Menu e localização

- Nova rota `/crm/oportunidades` com a página `src/pages/Oportunidades.tsx` (o conteúdo atual de `OportunidadesTab` é movido para lá — uma única base, sem duplicação).
- Item "Oportunidades" no menu lateral logo após Contas/Kanban (já existe na lista de sub-abas; passa a apontar para a nova rota).
- A sub-aba "Oportunidades de Negócio" dentro de Imóveis vira um **atalho que redireciona** para `/crm/oportunidades`.
- Rótulo "Em proposta" → "Proposta" em toda a interface (valor interno `proposta` mantido).

## 3. Ponte Contas → Oportunidades

Em `ContaFluxoAtendimento`, ao selecionar o destino "Comprar — Oportunidade" em uma conta em "Contato estabelecido":
- Abre o modal **"Criar Oportunidade de Negócio"** pré-preenchido (conta, cliente, telefone/e-mail, categoria Carteira/Marketing, origem, corretor responsável, resumo do atendimento) com os campos do diagnóstico (título, descrição da busca, tipo, cidade/bairro, valor-alvo, prioridade, prazo, forma de pagamento, permuta, observações).
- Se já existir oportunidade ativa para a conta: aviso + opção de abrir a existente ou confirmar criação de outra.
- Ao confirmar: cria em "Nova", grava `destino_comercial`, registra no histórico da conta e da oportunidade, preserva categoria de origem. Os demais destinos (Captação, HRX, Oportunidade futura) não entram no funil.

## 4. Formulário e detalhe da oportunidade

- `NovaOportunidadeDialog`: remove a opção "Lead" — **toda nova oportunidade exige Conta**; novos campos de diagnóstico/permuta. Oportunidades legadas com vínculo pendente ganham ação **"Converter ou vincular a uma Conta"** (reusa o alerta de duplicidade; não cria conta duplicada).
- Detalhe da oportunidade (dialog expandido com abas):
  - **Diagnóstico**: checklist visual do que está preenchido/pendente; ao mover de "Nova" para "Buscando imóvel" valida mínimos (conta, descrição, tipo, cidade/região, valor-alvo, corretor) e registra data/usuário.
  - **Imóveis**: vincular/remover, grau de interesse, marcar apresentado, feedback, motivo de rejeição, agendar visita, abrir ficha; contadores (vinculados, apresentados, interesse alto).
  - **Visitas**: agendar (status agendada/confirmada/realizada/cancelada/reagendada/não compareceu) e registrar pós-visita; caminhos pós-visita (voltar a Buscando, avançar a Proposta, Perdida).
  - **Propostas**: registrar/vincular propostas e contrapropostas com todos os campos e status internos; proposta aceita habilita "Marcar como Ganha".
  - **Tarefas** e **Histórico**: timeline completa (criação, etapas com tempo permanecido, imóveis, visitas, propostas, responsável, fechamento, perda).

## 5. Etapas finais com confirmação

- **Ganha**: drag ou ação abre modal obrigatório (conta, imóvel, proposta aceita, valor final, data, forma de pagamento, corretor, comissão prevista, observações; mínimos: conta, imóvel, valor final, corretor, data). Ao confirmar: marca Ganha, registra data/valor/usuário, **cria registro em `conta_fechamentos` vinculado à oportunidade**, e pergunta explicitamente se deseja marcar o imóvel como Vendido/Reservado (nunca automático). O registro completo de comissões continua no fluxo de Vendas existente.
- **Perdida**: modal obrigatório com os 11 motivos ("Outro" exige observação) e destino da Conta: **Oportunidade futura** (mantém categoria, define destino_comercial, pede data do próximo contato, cria tarefa), **Continuar relacionamento** (mantém "Contato estabelecido", cria próxima ação) ou **Contato cancelado** (move a conta com motivo). A conta nunca é excluída nem duplicada.

## 6. Kanban e cards

- Cards passam a exibir: categoria de origem (badge Carteira/Marketing), tempo na etapa, última interação, próxima ação, badge de permuta, indicadores de visita e de proposta, imóvel principal; nome da conta clicável (já é). Alerta para ativas sem próxima ação.
- Mudanças de etapa registram etapa anterior/nova, usuário, data/hora e tempo na etapa; Ganha/Perdida sempre via modal.

## 7. Migração das contas legadas (etapa comercial antiga)

- **Relatório prévio** (na própria página de Oportunidades, seção admin): lista conta, categoria, etapa legada, responsável, valor, existência de oportunidade — antes de qualquer migração.
- Função SQL **idempotente** `migrar_contas_legadas_oportunidades()` executável por admin com botão "Migrar legados":
  - `visita` → cria oportunidade em "Visita agendada"; `proposta` → em `proposta` (rótulo "Proposta"); `fechado` → "Ganha" + vínculo ao fechamento existente (sem duplicar fechamentos).
  - `reuniao`, `captacao_imovel`, `permuta`, `oportunidade_futura` (perdido): **não migradas automaticamente** — ficam no relatório para decisão manual (capitação segue no fluxo de captação; permuta é condição, não etapa).
  - Guarda anti-duplicidade: não cria segunda oportunidade para conta que já tenha uma da migração.

## 8. Relatórios

Nova aba **"Oportunidades"** em Relatórios (usando o filtro de período global existente): total ativas, valor-alvo do funil, por etapa, ganhas e valor ganho, perdidas, taxa de conversão, tempo médio até fechamento, visitas, propostas, conversão visita→proposta e proposta→ganho, motivos de perda, por corretor, por categoria de origem (Carteira vs Marketing), por origem específica. Filtros: período, corretor, categoria, origem, etapa, prioridade, tipo de imóvel, cidade, faixa de valor.

## 9. Ao final

Entrego o relatório de encerramento com os 16 pontos de aceite (contagens antes/depois, vínculos pendentes, campos criados, constraints — inalteradas, automações, testes).

## Detalhes técnicos

- 1 migração SQL nova (colunas + 2 tabelas + vínculos + backfill + função de migração legada + RLS/GRANTs). Constraints de `estagio`/`cliente_tipo` **intocadas**.
- Arquivos novos: `src/pages/Oportunidades.tsx`, `src/components/oportunidades/` (CriarOportunidadeDialog, OportunidadeDetailDialog com abas, GanhaDialog, PerdidaDialog, MigracaoLegadasPanel), `src/components/reports/OportunidadesReport.tsx`, `src/lib/oportunidadesFunil.ts`.
- Arquivos alterados: `App.tsx` (rota), `AppSidebar.tsx` (menu), `Imoveis.tsx` (atalho → redirect), `ContaFluxoAtendimento.tsx` (ponte), `NovaOportunidadeDialog.tsx` (só conta), `Reports.tsx` (nova aba).
- Visibilidade: corretor vê apenas as próprias oportunidades; admin/gestor veem tudo (espelha a regra de Contas).