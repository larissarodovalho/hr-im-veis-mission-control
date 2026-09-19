# Aplicar as nove recomendações do Acompanhamento

## Objetivo
Tornar o relatório uma leitura fiel do trabalho dos corretores em **Contas e Oportunidades**, deixando Leads apenas como contexto de entrada do Marketing e fechando as divergências de acesso, classificação e período.

## O que será feito

1. **Entrada do Marketing separada do trabalho do corretor**
   - Reformular o bloco 01 para não apresentar Leads, Contas e Oportunidades como se fossem necessariamente a mesma jornada.
   - Mostrar Leads como entrada do Marketing e usar os vínculos reais `Lead → Conta → Oportunidade` para indicar conversões efetivamente comprovadas.
   - Sinalizar registros sem vínculo válido, em vez de estimar conversão por totais independentes.

2. **Período baseado no trabalho realizado**
   - O Retrato por corretor passará a considerar Contas e Oportunidades que tiveram atividade no período: interação, tarefa, mudança de etapa, criação ou atualização comercial relevante.
   - Contas antigas atendidas no período entrarão no relatório.
   - A legenda e o PDF explicarão claramente o significado do período analisado.

3. **Medição por responsabilidade correta**
   - Contas serão atribuídas ao responsável atual da Conta.
   - Oportunidades serão atribuídas ao corretor da própria Oportunidade, conforme decidido, mesmo quando ele for diferente do responsável da Conta.
   - Divergências aparecerão como informação de auditoria, sem reatribuição automática.

4. **Oportunidade real versus oportunidade futura**
   - Separar “Oportunidade criada” de “Oportunidade futura”.
   - A classificação “Virando oportunidade” dependerá de uma Oportunidade realmente vinculada.
   - Contas marcadas para oportunidade futura, mas ainda sem Oportunidade criada, terão diagnóstico próprio e não inflarão conversões.

5. **Etapas antigas identificadas sem alterar dados**
   - As Contas nas etapas antigas serão reunidas em uma categoria visível “Etapa antiga — revisar”.
   - Nenhuma das 31 Contas será movida ou convertida automaticamente.
   - A categoria será explicada na legenda, exportação CSV e PDF.

6. **Acesso ao funil de Leads padronizado**
   - Permitir o funil de Leads somente para **admin, gestor e marketing**.
   - Bloquear corretores puros no menu, na página e na leitura/alteração dos dados, não apenas ocultar o item visualmente.
   - Preservar acessos de Hans e Gabriel pelos papéis de administração/gestão.

7. **Auditoria de divergências Conta × Oportunidade**
   - Adicionar indicadores para Oportunidades cujo corretor difere do responsável da Conta.
   - Exibir cliente, responsável da Conta, corretor da Oportunidade, etapa e situação.
   - Incluir essas informações no PDF/CSV, respeitando os filtros e a seleção de clientes.

8. **Cálculo único e seguro do Acompanhamento**
   - Substituir o cálculo atual por uma única assinatura oficial e remover a versão antiga após confirmar que não há chamadas restantes.
   - Garantir que totais, retrato por corretor e detalhamento fechem entre si.
   - Exibir separadamente registros sem responsável válido, evitando que desapareçam dos totais por corretor.

9. **Auditoria operacional por período**
   - Acrescentar uma leitura consolidada do trabalho realizado: interações, tarefas, movimentações de etapa, Contas trabalhadas e Oportunidades conduzidas.
   - Manter filtros por Base HR Imóveis, Marketing e Carteira própria.
   - Atualizar tela, PDF geral, PDF dos clientes selecionados, CSV e legenda com as mesmas regras.

## Regras preservadas

- Classificações manuais feitas por admin/gestor continuam prevalecendo sobre o diagnóstico automático.
- Nenhum responsável será trocado automaticamente.
- Nenhuma etapa antiga será migrada automaticamente.
- O detalhamento continuará abrindo vazio e exibindo clientes somente após busca ou filtro.
- O PDF dos selecionados continuará separado do PDF geral.
- Todos os horários e limites de período usarão o fuso de Cuiabá.

## Implementação técnica

- Criar uma migração aditiva para o novo cálculo por atividade, os indicadores de vínculo e as políticas de Leads; toda leitura seguirá as permissões por papel.
- Ajustar o relatório e os exportadores para o novo formato, mantendo compatibilidade durante a troca.
- Remover a sobrecarga antiga da função somente depois de validar que a tela usa exclusivamente a nova assinatura.
- Não criar tabelas novas sem necessidade; qualquer tabela pública nova terá permissões explícitas e proteção por usuário/papel.

## Validação

- Reconciliar os totais da tela com consultas diretas por período e por corretor.
- Testar separadamente admin, gestor, marketing e corretor puro no acesso a Leads.
- Conferir os casos de responsável divergente e as Contas em etapas antigas.
- Validar filtros de origem, busca, seleção, CSV e os dois PDFs em computador e celular.
- Executar verificações de segurança, tipos e compilação antes da entrega.
