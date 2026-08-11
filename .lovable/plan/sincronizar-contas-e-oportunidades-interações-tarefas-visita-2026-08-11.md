# Sincronizar Contas e Oportunidades (interações, tarefas, visitas, ligações, reuniões)

## Objetivo

Tudo que for lançado na conta de um cliente que tenha oportunidade aberta aparece automaticamente na oportunidade, e tudo lançado na oportunidade aparece na conta. Quando houver mais de uma oportunidade aberta, o vínculo é feito com a **mais recente**.

## Situação atual (verificada no banco e no código)

- **Propostas**: já sincronizam nos dois sentidos (colunas de vínculo e gatilhos já existem).
- **Interações**: a tabela tem `conta_id` e `oportunidade_id`. O que é lançado na oportunidade já grava `conta_id` (aparece na conta), mas o que é lançado na conta **não** grava `oportunidade_id` — por isso não aparece no histórico da oportunidade.
- **Tarefas**: a tabela tem `conta_id` e `oportunidade_id`, mas cada tela grava só a sua coluna e filtra só pela sua coluna.
- **Visitas**: existem dois lugares independentes — a agenda da conta (`visitas`, `reunioes`, `ligacoes`, todas com `conta_id`) e a aba Visitas da oportunidade (`oportunidade_visitas`). Não há nenhum vínculo entre eles.
- **Ligações e reuniões**: existem só do lado da conta; a oportunidade não as exibe.

## O que será feito

### 1. Vínculo automático com a oportunidade mais recente
Ao registrar na conta uma interação, tarefa, visita, ligação ou reunião, o sistema identifica sozinho a oportunidade aberta mais recente daquela conta e vincula o registro a ela. Se a conta não tiver oportunidade aberta, o registro fica só na conta, como hoje.

No sentido inverso, todo registro criado na oportunidade passa a gravar também a conta vinculada.

### 2. Histórico de interações unificado
O histórico da oportunidade passa a mostrar todas as interações da conta (não só as criadas dentro da oportunidade), e o histórico da conta continua mostrando tudo. Cada item ganha um selo indicando a origem ("Oportunidade" / "Conta") para não gerar confusão.

### 3. Tarefas unificadas
A aba de tarefas da oportunidade e a da conta passam a listar o mesmo conjunto (tarefas da conta + tarefas da oportunidade), e criar em qualquer lado grava os dois vínculos. Concluir/editar/excluir em um lado reflete no outro por ser o mesmo registro.

### 4. Visitas espelhadas nos dois lados
- Visita agendada na oportunidade cria automaticamente o compromisso na agenda da conta.
- Visita agendada na agenda da conta cria automaticamente o registro na aba Visitas da oportunidade aberta mais recente.
- Data, imóvel, corretor, status e observações ficam sincronizados; cancelar/excluir de um lado encerra o espelho do outro.

### 5. Ligações e reuniões na oportunidade
A oportunidade passa a exibir também as ligações e reuniões da conta vinculadas a ela, dentro da aba de visitas/atividades, com opção de registrar direto de lá.

### 6. Registros já existentes
Backfill: interações, tarefas, ligações, reuniões e visitas já cadastradas em contas que hoje têm uma única oportunidade aberta recebem o vínculo com essa oportunidade, preservando datas e autores. Contas com várias oportunidades abertas não são alteradas retroativamente, para não vincular ao lugar errado.

## Detalhes técnicos

- Migração:
  - Função `oportunidade_ativa_da_conta(_conta_id uuid)` (SECURITY DEFINER, `search_path=public`) retornando a oportunidade aberta mais recente (estágio fora de `ganha`/`perdida`).
  - Novas colunas de vínculo: `visitas.oportunidade_id`, `visitas.oportunidade_visita_id`; `oportunidade_visitas.visita_id`; `reunioes.oportunidade_id`; `ligacoes.oportunidade_id`.
  - Triggers BEFORE INSERT em `interacoes`, `tarefas`, `visitas`, `reunioes`, `ligacoes` para preencher `oportunidade_id` quando vier nulo e houver conta; e preencher `conta_id` quando vier da oportunidade.
  - Triggers AFTER INSERT/UPDATE/DELETE espelhando `visitas` ↔ `oportunidade_visitas`, com guarda anti-recursão (só grava quando os campos divergem).
  - Backfill no fim da migração, restrito a contas com exatamente uma oportunidade aberta.
- Frontend:
  - `src/components/oportunidades/OportunidadeDetailDialog.tsx`: histórico e tarefas passam a consultar por `oportunidade_id` OU `conta_id` da oportunidade; aba de visitas passa a listar também reuniões e ligações da conta; selos de origem.
  - `src/components/contas/ContaInteracoesTimeline.tsx` e `ContaTarefas.tsx`: selo de oportunidade vinculada com link.
  - `src/components/contas/ContaAgendaQuickAdd.tsx` e `ContaAgendamentosList.tsx`: sem mudança de lógica de gravação (o vínculo vem do banco); apenas exibição do selo da oportunidade.
