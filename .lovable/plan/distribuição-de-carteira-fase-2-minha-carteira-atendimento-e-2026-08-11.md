# Distribuição de Carteira — Fase 2: Minha Carteira, atendimento e transferências

A Fase 1 (distribuição em lotes pelo gestor) já está no ar. A Fase 2 entrega o outro lado: o que o corretor faz com as contas que recebeu, e como gestor e corretor tratam devoluções e transferências.

## O que o corretor passa a ter

**Nova página "Minha Carteira"** (menu CRM), visível para quem tem contas atribuídas:

- Cartões de resumo no topo: recebidas, primeiro contato pendente, no prazo, atrasadas, em atendimento, viraram oportunidade, devolvidas.
- Lista das contas do corretor com, em cada linha: nome, telefone, etapa do funil, lote de origem, data em que recebeu, prazo do primeiro contato com contagem regressiva (verde no prazo / âmbar hoje / vermelho atrasado), número de tentativas e próxima ação agendada.
- Filtros por situação (pendente, em andamento, atrasada, concluída, devolvida), por lote e busca por nome/telefone. Ordenação padrão: mais urgente primeiro.
- Abrir a conta leva à ficha do cliente já existente.

**Registrar atendimento** direto pela linha da conta:
- Registrar tentativa (WhatsApp, ligação, áudio, visita) com observação — grava a interação no histórico da conta e soma uma tentativa na atribuição.
- Marcar contato estabelecido — atualiza a atribuição e a etapa da conta.
- Agendar próxima ação (data/hora) — cria a tarefa que já alimenta a tag de contagem regressiva nos funis.
- Criar oportunidade a partir da conta (usa o fluxo de qualificação atual) e vincular à atribuição.

**Solicitar devolução ou transferência**: o corretor abre uma solicitação com motivo; a conta continua com ele até o gestor decidir.

## O que o gestor passa a ter

Na página de Distribuição, uma aba **"Acompanhamento"**:

- Lotes ativos com progresso: quantas contas já tiveram primeiro contato, quantas estão atrasadas, quantas viraram oportunidade.
- Fila de solicitações pendentes (devolução/transferência) com aprovar/recusar. Ao aprovar transferência, escolhe o novo corretor; ao aprovar devolução, a conta volta ao pool e fica elegível para novas distribuições.
- Ação de transferir ou devolver contas manualmente, mesmo sem solicitação.
- Cada decisão grava um evento no histórico imutável.

## Regras mantidas

- A conta continua com origem "Carteira HR Imóveis": o corretor vira responsável do lote, mas o vínculo original permanece registrado.
- Uma conta só pode ter uma atribuição ativa por vez.
- Corretor enxerga somente as próprias atribuições; gestor e admin enxergam tudo.
- Todos os prazos e contagens usam o fuso America/Cuiaba.

## Detalhes técnicos

- Banco: novas funções `SECURITY DEFINER` — `carteira_registrar_tentativa`, `carteira_marcar_contato`, `carteira_solicitar` (devolução/transferência), `carteira_resolver_solicitacao` (aprovar/recusar, com troca de `responsavel_id` da conta) e `carteira_minha_carteira` / `carteira_resumo_lotes` para leitura agregada. Todas escrevem em `carteira_eventos` e, quando aplicável, em `interacoes` e `tarefas`.
- Sem novas tabelas: as colunas `status`, `tentativas`, `proxima_acao`, `solicitacao_tipo`, `solicitacao_motivo`, `motivo_devolucao` e `motivo_transferencia` de `carteira_atribuicoes` já existem e serão usadas.
- Frontend: nova página `src/pages/MinhaCarteira.tsx` + rota `/crm/minha-carteira` e item no `AppSidebar`; aba "Acompanhamento" dentro de `src/pages/CarteiraDistribuicao.tsx`; novos hooks em `src/hooks/useCarteira.ts`; reaproveita `src/lib/tarefas.ts`, `src/lib/datetime.ts` e o diálogo de qualificação de oportunidade existentes.
- Badge "Carteira HR · Lote NN" nos cartões de conta em `src/pages/Accounts.tsx` / `ContasKanban.tsx`.
- Verificação: geração de um lote de teste, execução do ciclo completo (tentativa → contato → solicitação → decisão do gestor) no navegador e limpeza dos dados de teste ao final.

A Fase 3 (relatório de performance da carteira por corretor e auditoria) fica para a etapa seguinte.
