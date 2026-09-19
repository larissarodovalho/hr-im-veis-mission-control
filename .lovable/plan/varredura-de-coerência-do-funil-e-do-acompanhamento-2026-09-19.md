# Varredura de coerência do funil e do Acompanhamento

## Objetivo

Executar uma auditoria **somente de leitura**, sem alterar telas, permissões, dados ou cálculos, para conferir se o relatório de Acompanhamento representa corretamente o trabalho dos corretores em:

```text
Entrada/triagem de Marketing → Conta (Marketing ou Carteira) → Oportunidade
                                  ↑ trabalho do corretor ↑
```

O foco operacional do corretor será tratado como **Contas + Oportunidades**. Leads será analisado apenas como origem/triagem anterior, não como funil de trabalho do corretor.

## O que a leitura inicial já confirmou

- O Retrato por corretor e o detalhamento são calculados a partir de **Contas**, interações e tarefas; Leads não entram nesses dois blocos.
- A seção 01 mistura contagens independentes de Leads, Contas e Oportunidades como se fossem uma sequência única. Hoje não há rastreamento registro a registro nessa apresentação.
- O relatório filtra Contas pela data de criação. Assim, trabalho realizado no período em contas antigas pode não entrar no acompanhamento.
- O relatório identifica “virando oportunidade” pelo status da Conta, não pela situação real da Oportunidade vinculada.
- Há duas versões ativas da função do relatório no banco; a tela atual chama a versão nova, com filtro de origem.
- Os corretores puros Rafael e Douglas têm o menu Leads explicitamente bloqueado. Gabriel também tem papel de gestor, e Hans é administrador; esses papéis mantêm acesso amplo por padrão.
- As regras de dados ainda permitem que um corretor leia seus próprios Leads, mesmo quando o menu está oculto. Portanto, ocultar a página e bloquear os dados não são hoje a mesma coisa.
- Contas e Oportunidades estão vinculadas, mas existem **5 casos com responsáveis diferentes**; 3 dessas oportunidades continuam ativas.
- Existem **349 Contas marcadas como oportunidade futura sem uma Oportunidade criada**. Isso pode ser legítimo, mas precisa ser separado de oportunidade ativa nos indicadores.
- Existem **692 Contas sem interação registrada**, principalmente em “A contatar” e “Sem retorno”.
- Existem etapas antigas em 31 Contas (`contatado` e `perdido`), fora das etapas atuais do funil.
- Há 1 Conta apontando para um Lead de origem inexistente.

## Checklist da auditoria

### 1. Acesso dos corretores

- Conferir, por usuário e papel, o acesso visível aos menus Leads, Contas e Oportunidades.
- Comparar o menu com as permissões reais dos dados, distinguindo “não aparece” de “não pode acessar”.
- Confirmar que cada corretor vê somente suas Contas e Oportunidades, incluindo contas ligadas a oportunidades sob sua responsabilidade.
- Registrar separadamente os casos de Hans e Gabriel, pois acumulam papéis de gestão.

### 2. Coerência Conta → responsável → Oportunidade

- Listar Contas sem responsável e Oportunidades sem corretor ou sem Conta válida.
- Conferir divergências entre o responsável atual da Conta e o corretor da Oportunidade.
- Verificar se redistribuições de carteira atualizam ou preservam corretamente o responsável da Oportunidade.
- Conferir Oportunidades duplicadas por Conta e distinguir as encerradas das ativas.

### 3. Coerência do trabalho registrado

- Comparar etapa da Conta, última interação, próxima tarefa e dias sem contato.
- Separar contas realmente sem atendimento de contas novas ainda em “A contatar”.
- Identificar etapas antigas e avaliar como o relatório atual as classifica.
- Conferir classificações manuais que substituem permanentemente o diagnóstico automático.

### 4. Ponte Marketing/Carteira → Conta

- Validar `categoria`, origem da carteira, dono original e responsável atual.
- Conferir todos os valores reais de origem de Leads e Contas contra as regras “Base HR Imóveis”, “Marketing” e “Carteira própria”.
- Validar os vínculos Lead → Conta, sem usar o Lead como trabalho operacional do corretor.
- Medir conversões ocorridas em períodos diferentes para evitar comparações falsas.

### 5. Ponte Conta → Oportunidade

- Comparar o status de qualificação da Conta com a existência e o estágio real da Oportunidade.
- Separar “oportunidade futura” de Oportunidade efetivamente criada.
- Conferir se os indicadores usam o responsável correto quando Conta e Oportunidade divergem.
- Validar ganho, perda e oportunidades ativas pelo próprio funil de Oportunidades.

### 6. Coerência do relatório de Acompanhamento

Auditar cada número exibido:

- **Entrada:** origem/triagem de Marketing, sem atribuir esse trabalho ao corretor.
- **Contas em carteira:** Contas de Marketing e Carteira sob responsabilidade do corretor.
- **Retrato por corretor:** responsável atual, interações, tarefas e situação da Conta.
- **Taxa de incidência:** mesmo universo e mesmo período no numerador e denominador.
- **Oportunidades:** vínculo real com a Conta e estágio real, não apenas status gravado na Conta.
- **Detalhamento:** cada linha deve reconciliar com a tela da Conta e, quando aplicável, com sua Oportunidade.
- **Período:** distinguir criação no período de atividade ocorrida no período.

## Entrega da varredura

Será apresentado um relatório sem mudanças no sistema, dividido em:

1. **Itens coerentes** — regras que já correspondem ao processo real.
2. **Divergências confirmadas** — com quantidade, impacto e exemplos identificáveis para conferência interna.
3. **Pontos que dependem de decisão de negócio** — sem tratá-los automaticamente como erro.
4. **Checklist final por corretor** — Contas de Marketing, Carteira própria, Oportunidades e atividade registrada.
5. **Recomendações priorizadas** — apenas recomendações; nenhuma será aplicada sem uma solicitação posterior.

## Garantia de escopo

- Nenhuma alteração em dados.
- Nenhuma alteração em permissões.
- Nenhuma alteração no relatório ou nos funis.
- Nenhuma correção automática das divergências encontradas.
