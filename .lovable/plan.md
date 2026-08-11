# Unificar oportunidades duplicadas

Hoje existe 1 caso de duplicidade real na base: a conta "Casa até 2 milhões" tem duas oportunidades (uma em "buscando" e outra "perdida"). Vamos criar um recurso permanente para detectar e unificar duplicatas sem perder nenhum histórico.

## O que será entregue

1. **Detecção automática de duplicidade** na aba Oportunidades
   - Considera duplicadas as oportunidades da mesma conta (ou mesmo cliente/lead quando não há conta) que ainda não estão encerradas em conjunto.
   - Um selo "Possível duplicidade" aparece nos cards/linhas envolvidos, e um chip no topo mostra quantos grupos duplicados existem, abrindo a lista.

2. **Dialog "Unificar oportunidades"**
   - Mostra lado a lado as oportunidades do grupo (título, etapa, corretor, valor, data de criação, quantidade de interações/visitas/propostas).
   - O usuário escolhe qual será a oportunidade principal (padrão sugerido: a mais avançada no funil e, em empate, a mais recente).
   - Prévia do que será transferido antes de confirmar.

3. **Unificação preservando 100% do histórico**
   - Todos os registros vinculados à duplicada passam para a principal: interações, tarefas, visitas (e visitas de oportunidade), reuniões, ligações, propostas (de conta e de oportunidade), imóveis vinculados, fechamentos e vínculos de carteira.
   - Campos vazios na principal são preenchidos com os dados da duplicada (valor alvo, tipo de imóvel, cidade/bairro, forma de pagamento, permuta, diagnóstico, origem etc.) — nada existente na principal é sobrescrito.
   - As observações/descrição da duplicada são anexadas ao final das observações da principal, com data e identificação.
   - A oportunidade duplicada é removida somente depois da transferência, e o evento fica registrado no histórico de interações da principal ("Oportunidade unificada").

4. **Permissão**: apenas admin e gestor podem unificar.

## Detalhes técnicos

- Nova função no banco `public.oportunidades_unificar(_principal uuid, _duplicada uuid)` (SECURITY DEFINER), que valida mesma conta/cliente, checa papel via `has_role`, faz o `UPDATE` de `oportunidade_id` em: `interacoes`, `tarefas`, `visitas`, `oportunidade_visitas`, `reunioes`, `ligacoes`, `conta_propostas`, `oportunidade_propostas`, `oportunidade_imoveis`, `conta_fechamentos`, `carteira_atribuicoes`; faz o merge de colunas nulas; insere a interação de log; e apaga a duplicada.
- Nova função `public.oportunidades_duplicadas()` retornando os grupos com contagens, para alimentar a UI.
- Frontend: novo componente `src/components/oportunidades/UnificarOportunidadesDialog.tsx` e integração em `src/pages/Oportunidades.tsx` (chip de duplicidade + selo nos cards). Após unificar, recarrega a lista.
