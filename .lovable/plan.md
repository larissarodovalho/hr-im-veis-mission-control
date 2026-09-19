# Relatórios: nova aba "Acompanhamento dos corretores"

Nada do que já existe em Relatórios muda. Entra apenas uma aba nova, no mesmo padrão visual do CRM, reproduzindo a leitura do PDF enviado: o que cada corretor fez (ou deixou de fazer) nas contas da carteira dele, dentro do período já selecionado no topo da página.

## Estrutura da aba (mesma sequência do PDF)

**01 · Entrada — para onde foram os leads**
Quatro números grandes: leads no período; % que passou da triagem; % que virou oportunidade; % travado por falta de follow-up. Abaixo, o caminho em três níveis: origem (Meta Ads, site, indicação…), triagem (seguiram para corretores x desclassificados) e onde pararam (contas em carteira, oportunidades, perdidos após triagem).

**02 · Retrato por corretor**
Uma linha por corretor com: total de contas, % travada, contas travadas, falha de processo, desfecho do cliente, em jogo, principal problema e quantas contas nele. Barra proporcional para comparar carteiras de tamanhos diferentes. Frase-resumo abaixo com o consolidado das carteiras.

**03 · Taxa de incidência**
Um quadro por categoria (Falta de follow-up, CRM desatualizado, Sem retorno, Sem interesse, Desqualificado, Encerrado, Virando oportunidade, Ciclo em andamento), cada um com os corretores lado a lado em % da carteira e contagem, e o selo do grupo (falha de processo / desfecho do cliente / em jogo).

**04 · Leituras**
Três blocos de texto gerados a partir dos próprios números: onde o funil falha, se é padrão da casa ou de um corretor, e o prazo médio sem contato nos casos travados.

**05 · Conta a conta**
Tabela com todas as contas do período: cliente, corretor, classificação (selo colorido), observação e dias sem contato. Filtros por corretor e por classificação, link para abrir a conta e exportação em CSV.

## Como a classificação é definida

Cada conta recebe uma classificação automática a partir do que já está no CRM:

- **Virando oportunidade** — qualificada como oportunidade ativa/futura ou já convertida
- **Ciclo em andamento** — contatos dentro da cadência e tarefa futura agendada
- **Sem retorno / Sem interesse / Desqualificado / Encerrado** — etapa "Sem retorno" ou "Contato cancelado", separados pelo motivo registrado no cancelamento
- **CRM desatualizado** — conta avançou de etapa mas sem registro de interação correspondente
- **Falta de follow-up** — conta ativa com intervalo entre contatos acima do prazo configurado, ou sem contato há mais dias que o limite

O prazo máximo entre contatos fica configurável no topo da aba (padrão 7 dias), já que o PDF aponta a cadência como o problema comum. O gestor também pode reclassificar manualmente uma conta e escrever a observação — a classificação manual prevalece sobre a automática, como o próprio PDF prevê.

## Detalhes técnicos

- Nova tabela `conta_acompanhamento` (conta_id único, classificacao, observacao, autor, updated_at) com RLS de leitura para staff e escrita apenas admin/gestor, mais GRANTs.
- Função `SECURITY DEFINER` somente-leitura `acompanhamento_corretores(_inicio, _fim, _prazo_dias)` restrita a admin/gestor, agregando `leads`, `contas`, `interacoes`, `tarefas` e `oportunidades`, devolvendo: resumo de entrada, linhas por corretor, incidência por categoria e a lista conta a conta com dias sem contato, classificação automática e a manual quando existir.
- Novo componente `src/components/reports/AcompanhamentoCorretoresReport.tsx` com as cinco seções e CSV via Papa.parse; aba "Acompanhamento" adicionada à `TabsList` de `src/pages/Reports.tsx` sem alterar as abas existentes.
- Datas via helpers de `src/lib/datetime.ts` (America/Cuiaba); etapas e motivos via `src/lib/contasFunil.ts`; cadência reaproveitando `src/lib/tarefas.ts`.
