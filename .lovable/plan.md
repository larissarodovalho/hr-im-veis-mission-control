# Distribuição de Carteira — plano de implementação

Funcionalidade para o gestor distribuir contas da carteira HR (1.300+ registros) entre corretores já cadastrados, em lotes, com histórico, acompanhamento e relatório gerencial. Nada de conta ou contato novo: a distribuição apenas define quem atende cada conta existente.

## Decisões já definidas

- Ao confirmar o lote, o corretor vira **responsável da conta** (campo já usado nos funis), e a conta continua marcada como **origem Carteira HR Imóveis** — a categoria `carteira` e o vínculo com o lote ficam visíveis no card e no detalhe.
- **Elegível** = qualquer conta ativa, não cancelada/desclassificada, com telefone ou e-mail, e **sem atribuição ativa** em outro lote. Ter responsável hoje não impede (é redistribuição), mas a prévia mostra quem é o responsável atual.
- Entrega **em fases**, com validação sua ao final de cada uma.

## Fase 1 — Distribuição, lotes e atribuições

Nova página **Carteira › Distribuição** (dentro do CRM, visível só para admin/gestor).

Fluxo em 4 passos:
1. **Corretores e quantidades** — lista carregada automaticamente dos usuários com perfil Corretor (nada fixo no código). Para cada corretor: quantidade, prazo do 1º contato, observação interna. Botão para adicionar mais corretores. Rodapé mostra total da operação.
2. **Modo de seleção** — Automático aleatório / Manual / Automático com ajuste.
3. **Seleção** — filtros sobre campos já existentes (categoria, etapa do funil, cidade, origem, interesse, temperatura, tags, responsável atual, sem oportunidade ativa, sem contato recente). Contador permanente: elegíveis, selecionadas, faltando, excedente, impedidas com motivo. No manual: busca por nome/telefone/e-mail, seleção em massa por página e por filtro inteiro.
4. **Prévia e confirmação** — lotes lado a lado, busca dentro do lote, remover, substituir (manual ou aleatória), mover conta entre lotes, gerar nova seleção. Um único botão "Confirmar distribuição dos lotes".

Regras: embaralhamento e divisão feitos no servidor; confirmação atômica (revalida corretores ativos, elegibilidade e duplicidade — se houver conflito nada é gravado e a operação fica "Em revisão").

Ao confirmar, para cada conta: cria atribuição, define responsável, vincula ao lote, cria tarefa de primeiro contato com o prazo do lote, registra evento no histórico e uma nota na timeline da conta.

## Fase 2 — Minha Carteira, atendimento e transferências

- **Minha Carteira** para o corretor: só as contas atribuídas a ele, em lista/tabela/kanban, com prazo, última atividade, próxima ação, tentativas, oportunidades e alerta de atraso. Filtros: sem atendimento, 1º contato pendente, contato tentado, contato estabelecido, diagnóstico, oportunidade criada, visita, proposta, sem próxima ação, atrasado.
- Registro de atividades usa a timeline de interações que já existe; cada interação passa a carregar o vínculo com a atribuição/lote.
- Primeira atividade e contato estabelecido gravam data automaticamente e atualizam o status da atribuição.
- **Transferência / devolução / redistribuição**: corretor apenas solicita; gestor e admin concluem, individualmente ou em massa ("Transferir contas selecionadas"), com motivo obrigatório da lista definida. A atribuição anterior é encerrada e uma nova é criada, preservando corretor original, atividades e lote de origem.
- Oportunidade gerada a partir da conta atribuída reaproveita conta e contato existentes e leva lote, atribuição, operação, corretor original e corretor gerador. Oportunidade perdida não apaga nada; o gestor escolhe manter, devolver, redistribuir ou reprogramar.

## Fase 3 — Relatório e auditoria

Nova modalidade dentro da aba **Relatórios** já existente: **"Contas Atribuídas — Performance por Corretor"**, só para admin/gestor (menu, rota, consultas e exportação bloqueados para corretor — não é só esconder o botão).

- **Visão consolidada por corretor**: atribuídas, sob responsabilidade hoje, trabalhadas, sem atividade, prazo vencido, sem próxima ação, % trabalhada, tentativas, contatos estabelecidos, diagnósticos, oportunidades, visitas agendadas/realizadas, propostas, ganhos, perdidos, devolvidas, transferidas, recebidas, tempo médio até 1ª atividade e até contato estabelecido, valores de oportunidades/propostas/ganhos e VGV.
- **Visão detalhada por conta**: todos os campos da atribuição, tempos, etapa, dias parados, oportunidade vinculada e histórico de transferências.
- Taxas de conversão com proteção contra divisão por zero.
- Alternador **performance pela atribuição original × pelo responsável atual**.
- Indicadores clicáveis abrindo a lista exata de contas que os compõem.
- Filtros por corretor (original, atual, gerador, fechador), lote, operação, modo, gestor, períodos, status, etapa, origem, cidade, interesse e recortes (com/sem atividade, atrasadas, transferidas, devolvidas, ganhas, perdidas).
- Exportação CSV/Excel respeitando os filtros, registrada na auditoria.
- Painel de alertas gerenciais (contas sem atividade, atrasadas, sem próxima ação, lotes com baixo aproveitamento, contato inválido).

## Detalhes técnicos

Novas tabelas (nenhuma altera contas/contatos além do responsável e do vínculo de lote):

- `carteira_operacoes` — operação de distribuição: modo, gestor, filtros aplicados (JSON), totais, status, auditoria da seleção.
- `carteira_lotes` — um por corretor: nome gerado ("Carteira – Nome – Lote 01"), corretor, gestor, modo, quantidades definida/atribuída/ativa, prazo do 1º contato, objetivo, observação, status (planejado, em revisão, ativo, em andamento, concluído, cancelado).
- `carteira_atribuicoes` — conta, lote, operação, corretor original, corretor atual, gestor, datas (atribuição, prazo, 1ª atividade, contato estabelecido, última atividade, próxima ação, encerramento), status, resultado, oportunidade gerada, motivos. Índice único parcial garantindo **uma atribuição ativa por conta**.
- `carteira_eventos` — histórico imutável (sem update/delete para corretor): tipo, responsável anterior/novo, gestor, motivo, lote anterior/novo, status anterior/novo, timestamps.
- `carteira_selecao_itens` — seleção provisória antes da confirmação (descartada ao gerar nova seleção).
- Colunas de vínculo em `oportunidades` (`atribuicao_id`, `lote_id`, `operacao_id`, `corretor_original_id`, `corretor_gerador_id`) e em `interacoes` (`atribuicao_id`), todas opcionais.

RLS: admin/gestor com acesso total; corretor lê apenas lotes/atribuições/eventos dos quais é corretor atual e não pode alterar responsável, lote, datas ou histórico. Observações internas da gestão e auditoria ficam fora do alcance do corretor. Todas as tabelas novas recebem GRANT explícito.

Lógica sensível em funções de banco `security definer` chamadas pela aplicação: sortear e dividir a seleção (embaralhamento no servidor), confirmar distribuição em transação única, transferir em massa, devolver, e agregações do relatório. A UI reaproveita os componentes atuais (kanban de contas, `SearchableSelect` com busca no servidor, `PeriodPicker` dos relatórios, badges de tarefa/countdown) para manter o padrão visual.

## Fora do escopo

Não serão criados novos módulos de contas, contatos, tarefas, oportunidades ou funis — tudo reaproveita o que já existe.
