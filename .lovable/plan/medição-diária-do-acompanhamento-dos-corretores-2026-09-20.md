# Medição diária do acompanhamento dos corretores

## Objetivo
Trocar a fotografia atual por uma apuração diária, para que Douglas, Rafael e os demais corretores sejam avaliados pelo trabalho exigível em cada dia útil do período selecionado.

## Regra principal
- Considerar somente **segunda a sexta-feira**, sempre no fuso de Cuiabá.
- Em cada dia, formar a carteira de contas que estavam sob responsabilidade de cada corretor e identificar quais estavam **exigíveis** naquele dia.
- Conta exigível: conta ativa que precisava de contato ou atualização naquele dia, conforme o prazo máximo configurado, tarefa vencida/prevista ou próximo atendimento programado.
- Uma conta exigível fica **atualizada** quando houver registro de atendimento no dia ou dentro do prazo válido; caso contrário, fica **desatualizada**.
- O percentual do período será calculado por **conta-dia exigível**: cada conta pode contribuir em vários dias úteis, refletindo a constância do trabalho.
- Contas sem qualquer movimentação não desaparecerão do cálculo quando estiverem exigíveis.

## Todos os problemas lado a lado
Aplicar a mesma base diária aos demais quadros, evitando misturar uma fotografia atual com números históricos:
- falta de follow-up;
- CRM desatualizado;
- sem retorno;
- sem interesse;
- desqualificado;
- encerrado;
- oportunidade criada;
- oportunidade futura;
- etapa antiga;
- ciclo em andamento.

Cada quadro mostrará, por corretor:
- quantidade de ocorrências em conta-dias;
- percentual sobre as contas exigíveis nos dias úteis;
- evolução diária no período, permitindo enxergar melhora ou piora.

Uma mesma conta poderá ter diagnósticos diferentes em dias diferentes, mas apenas um diagnóstico principal por dia. A classificação manual de admin/gestor continuará prevalecendo a partir da data em que foi registrada.

## Tela e exportações
- Ajustar “CRM atualizado × desatualizado” para usar os percentuais diários reais, mantendo a barra verde/vermelha fechando 100% das contas exigíveis.
- Exibir uma pequena evolução por dia útil e o consolidado do período em todos os quadros.
- Atualizar as explicações e legendas para deixar claro o conceito de conta-dia exigível.
- Levar os mesmos números e evolução diária ao PDF e ao CSV, sem divergência entre tela e exportações.
- Manter filtros de período, origem da carteira, corretor, classificação e seleção de clientes.

## Histórico e precisão
- Criar uma apuração diária persistida, somente para o acompanhamento, sem alterar contas, responsáveis, etapas ou oportunidades.
- Reconstruir o histórico possível a partir de interações, tarefas, atribuições e eventos com data registrada.
- Onde um estado antigo não puder ser provado pelos dados existentes, não inventar o valor: marcar o dia como histórico não determinável e excluí-lo do denominador daquela métrica.
- A partir da implantação, registrar diariamente o resultado completo e auditável.

## Segurança e validação
- Manter o relatório restrito a admin e gestor.
- Proteger a nova apuração com as mesmas regras de acesso e leitura já usadas no acompanhamento.
- Validar especialmente Douglas e Rafael em diferentes períodos, conferindo dias com e sem registros.
- Testar fechamento dos percentuais, fins de semana excluídos, mudança de responsável, tarefas programadas, classificação manual, filtros, tela em computador/celular, PDF e CSV.

## Detalhes técnicos
- Criar uma tabela diária com uma linha por conta, responsável e dia útil, incluindo exigibilidade, diagnóstico, motivo e origem da carteira; incluir permissões e políticas de acesso na mesma alteração.
- Criar a rotina idempotente de cálculo diário e o preenchimento retroativo baseado somente em eventos auditáveis.
- Atualizar a função de acompanhamento para devolver consolidados e séries diárias usando essa base, sem depender de `current_date` para períodos passados.
- Preservar as regras existentes: sem reatribuição automática, sem migração automática de etapas antigas, Oportunidade mantém seu corretor e período em `America/Cuiaba`.
