# Corrigir e sincronizar os problemas por produtividade real

## Objetivo
Fazer a seção **“Cada problema, lado a lado”** mostrar números reais por corretor e por dia útil, sincronizados com o trabalho registrado em Contas e Oportunidades.

## Diagnóstico confirmado
- O CRM possui **1.516 contas**, todas com responsável e data de criação.
- Há produtividade registrada no período, incluindo interações e tarefas de Hans, Gabriel, Douglas e Rafael.
- A nova base diária `acompanhamento_conta_diario` está com **zero registros**. Por isso a tela recebe zero dias úteis e não possui linhas para desenhar os problemas.
- O relatório geral continua retornando dados, mas os quadros diários dependem exclusivamente dessa base vazia.
- A tela hoje transforma a falha da apuração em um quadro vazio, sem distinguir “sem ocorrências” de “não foi possível calcular”.

## Correção
1. **Reparar a apuração diária**
   - Corrigir a rotina que forma os conta-dias e garantir que ela grave e retorne resultados para o período selecionado.
   - Manter dias úteis e o fuso de Cuiabá.
   - Tornar a execução idempotente: recalcular o mesmo período não duplica registros.
   - Registrar a execução e retornar erro claro quando a apuração não puder ser concluída.

2. **Sincronizar com a produtividade real**
   - Para cada conta e dia útil, reconstruir o responsável válido pela atribuição vigente naquele dia.
   - Usar registros auditáveis de interações, tarefas, próximas ações, mudanças de etapa e oportunidades.
   - Não atribuir atividade de uma oportunidade ao corretor atual da conta quando a oportunidade pertence a outro corretor.
   - Não inventar estados históricos: dias sem evidência suficiente ficam fora do denominador e aparecem como não determináveis.

3. **Calcular cada problema com a mesma base**
   - **CRM atualizado/desatualizado:** atendimento ou atualização válida dentro do prazo versus exigência não cumprida.
   - **Falta de follow-up:** prazo máximo vencido sem novo contato.
   - **Sem retorno, sem interesse, desqualificado e encerrado:** usar o desfecho efetivamente registrado e sua data de vigência.
   - **Oportunidade criada e oportunidade futura:** usar criação, estágio e responsável da oportunidade.
   - **Ciclo em andamento:** conta ativa, dentro da cadência e com próxima ação válida.
   - **Etapa antiga:** somente quando a etapa legada estiver comprovada naquele período.
   - Manter um diagnóstico principal por conta-dia para evitar dupla contagem.

4. **Evitar quadros vazios enganosos**
   - Mostrar os corretores mesmo quando um problema específico for zero.
   - Exibir “0 ocorrências” apenas quando a apuração tiver sido concluída com sucesso.
   - Exibir um aviso de falha com opção de tentar novamente quando a apuração não carregar, em vez de mostrar “0 dias úteis”.

5. **Unificar tela e exportações**
   - Usar o mesmo resultado diário no retrato por corretor, em todos os problemas, na evolução diária, no PDF e no CSV.
   - Mostrar quantidade de conta-dias, percentual e evolução por dia para cada corretor.

## Validação
- Conferir Hans, Gabriel, Douglas e Rafael comparando os números do relatório com interações, tarefas e oportunidades reais do mesmo período.
- Validar períodos com e sem atividade, troca de responsável, tarefas futuras/vencidas e oportunidades com corretor diferente da conta.
- Confirmar que os percentuais de CRM fecham 100% e que cada conta-dia recebe no máximo um problema principal.
- Confirmar que a base diária deixa de estar vazia e que a tela não mostra mais “0 dias úteis” quando há produtividade.
- Validar tela, PDF e CSV com os mesmos totais.

## Detalhes técnicos
- Ajustar a função `acompanhamento_apurar_diario` e a persistência em `acompanhamento_conta_diario` por migração.
- Preservar RLS e acesso somente para admin/gestor.
- Atualizar o tratamento de erro e o estado vazio no relatório.
- Adicionar testes de apuração, atribuição histórica, exclusão de histórico não determinável, fechamento percentual e consistência entre consolidados e série diária.
