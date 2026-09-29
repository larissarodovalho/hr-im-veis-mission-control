# Botão "Standby" em Contas e Oportunidades

## O que o corretor vai ver
- Na página da conta e dentro de cada oportunidade, um botão **Colocar em standby**.
- Ao clicar, abre uma janela com:
  - Prazo rápido: 7, 15, 30, 60 dias, ou uma data escolhida.
  - Motivo/observação (ex.: "Cliente pediu para ligar em 15 dias").
- Ao confirmar:
  - A conta/oportunidade ganha o selo **Standby até dd/mm** (na página e nos cards dos funis).
  - Uma **tarefa de retomada** é criada automaticamente para o corretor responsável, com vencimento na data escolhida ("Retomar contato — standby").
  - Fica registrado no histórico da conta (quem colocou, quando, até quando, motivo).
- Botão **Retomar agora** encerra o standby antes do prazo. Quando a tarefa de retomada é concluída ou um novo atendimento é registrado, o standby termina sozinho.
- A etapa do funil **não muda** (a conta continua em "Contato estabelecido", a oportunidade continua no seu estágio).
- Filtro "Em standby" nos funis de Contas e Oportunidades.

## Quando o prazo vence
- A tarefa fica vencida e aparece nos alertas do corretor, como qualquer tarefa atrasada.
- O selo muda para **Standby vencido** (vermelho).

## Sincronização com o Acompanhamento (Relatórios)
- Durante o standby dentro do prazo, os dias da conta **não contam como follow-up não feito** — contam como "feito/programado", pois é atendimento combinado com o cliente.
- A partir do dia seguinte ao vencimento sem retomada, volta a contar como "não feito".
- Performance: novo indicador "Em standby" por corretor (tela e PDF).

## Detalhes técnicos
- Migração: em `contas` e `oportunidades`, colunas `standby_ate timestamptz`, `standby_motivo text`, `standby_desde timestamptz`, `standby_por uuid` (todas opcionais). Tarefa de retomada em `tarefas` com `conta_id`/`oportunidade_id` e um marcador `origem='standby'` (nova coluna opcional).
- Histórico: registro em `interacoes`/activity log ao entrar e sair do standby.
- Ao colocar em standby, também grava `contas.proxima_acao_em = standby_ate` (a regra atual já trata "próxima ação futura" como atendimento programado).
- Fim automático: gatilho no banco ao concluir a tarefa de standby ou ao inserir interação na conta limpa os campos.
- RPC `acompanhamento_apurar_diario`: conta-dia com `standby_desde <= dia <= standby_ate` é tratado como feito; assinatura mantida.
- Componentes: `StandbyDialog` e `StandbyBadge` compartilhados, usados em `AccountDetail.tsx`, `OportunidadeDetailDialog.tsx`, `ContasKanban.tsx` e funil de oportunidades; `performancePdf.ts` ganha o indicador.
- Mantidas as regras: não reatribui responsável, não muda etapa, Oportunidade mantém seu corretor.
