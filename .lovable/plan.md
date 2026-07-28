## Consolidar contas duplicadas — Kelly Negrão e Marco Aurelio

### Kelly Negrão
- **Manter**: conta de Marketing → mover para etapa `a_contatar` e garantir tag `marketing`.
- **Arquivar**: conta de Carteira (gabriel-souza).
- Antes de arquivar: migrar para a conta mantida tudo que estiver vinculado à conta duplicada — interações, tarefas, reuniões, visitas, ligações, propostas, fechamentos, oportunidades, notas, contratos, vendas, captações — e reapontar `lead_id_origem` se necessário.

### Marco Aurelio
- **Manter**: conta de Carteira (gabriel-souza) → mover para o funil de Carteira (remover tag `marketing` se existir, manter/garantir tag de carteira do responsável) e definir etapa `a_contatar`.
- **Arquivar**: conta de Marketing duplicada.
- Mesma migração de vínculos da conta arquivada para a conta mantida antes de excluir.

### Execução
1. Rodar SQL de reapontamento em todas as tabelas filhas (`interacoes`, `tarefas`, `reunioes`, `visitas`, `ligacoes`, `conta_propostas`, `conta_fechamentos`, `conta_propriedades`, `oportunidades` via `cliente_id`, `notas` via `entidade_id`, `contratos`, `vendas`, `captacoes_imovel`, `booking_links`) apontando da conta arquivada para a mantida.
2. Atualizar `lead_id_origem` na conta mantida quando o lead correspondente estava vinculado à arquivada.
3. Atualizar `etapa_funil` e `tags` das contas mantidas conforme acima.
4. Excluir as duas contas duplicadas.

### Confirmação necessária
Marco Aurelio: a conta de Carteira hoje está em etapa `perdido`. Confirma trazer para `a_contatar` no funil de Carteira? Se preferir outra etapa, me diz.
