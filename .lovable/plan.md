# Integração Contato estabelecido → Oportunidades de Negócio

## Estado atual (verificado no código)

- A ponte hoje depende de selecionar o marcador "Comprar — Oportunidade" em `ContaFluxoAtendimento` (destino comercial) para abrir o `CriarOportunidadeDialog`. Arrastar o card no Kanban para "Contato estabelecido" (`moveStage` em `Accounts.tsx`) não dispara nada.
- `CriarOportunidadeDialog` já vincula conta, categoria, corretor, origem e lead de origem, e já avisa sobre oportunidade ativa existente — mas não é idempotente (duplo clique/reload cria duplicada) e não tem os 3 resultados da qualificação.
- A tabela `contas` não tem campos de qualificação (status, data, resultado).

## 1. Banco de dados (1 migração)

Novas colunas em `public.contas`:
- `qualificacao_status text` — valores: `pendente` | `oportunidade_ativa` | `oportunidade_futura` | `nao_qualificado` (null = nunca qualificada)
- `qualificacao_em timestamptz`, `qualificacao_por uuid` (ref auth.users)
- `proxima_acao_em timestamptz` — próximo contato quando oportunidade futura

Nova coluna em `public.oportunidades`:
- `chave_idempotencia text` + índice único parcial (`WHERE chave_idempotencia IS NOT NULL`) — impede duplicidade por duplo clique, reload ou reenvio.

Nova RPC `criar_oportunidade_qualificada(p_conta_id uuid, p_payload jsonb, p_chave text)` (security definer, grant authenticated):
1. Se já existe oportunidade com `p_chave` → retorna a existente (idempotência).
2. Valida campos mínimos (título, descrição, tipo, cidade ou bairro, valor-alvo, corretor).
3. Insere em `nova` com `conta_id`, `cliente_tipo='conta'`, `categoria_origem`, `origem`, `corretor_id`, `lead_id_origem` copiados da conta (fonte única, sem confiar no cliente).
4. Atualiza a conta: `qualificacao_status='oportunidade_ativa'`, `qualificacao_em/por`, `destino_comercial='comprar_oportunidade'` — sem mudar etapa nem categoria.
5. Registra interação na linha do tempo da conta e na da oportunidade (com data/hora/usuário).
Tudo em uma transação: ou completa ou não cria nada.

Backfill: contas já em `contato_estabelecido` com oportunidade ativa → `qualificacao_status='oportunidade_ativa'`; com `destino_comercial='oportunidade_futura'` → `'oportunidade_futura'`; demais em contato estabelecido → `'pendente'`.

## 2. Novo componente: `QualificacaoOportunidadeDialog.tsx`

Modal "Qualificação da oportunidade", usado nos 3 pontos de entrada (Kanban, detalhe da conta, automático ao mover):

- **Resumo automático da conta** (somente leitura): nome, telefone, e-mail, categoria (Carteira/Marketing), origem específica, campanha/formulário (via lead de origem quando houver), corretor responsável, interesse registrado e resumo das últimas interações.
- **Formulário da oportunidade**: título*, descrição da busca*, tipo de imóvel*, cidade*, bairro/região/condomínio, valor-alvo*, prazo estimado, prioridade, forma de pagamento, possibilidade de financiamento (checkbox), permuta (imóvel + valor estimado), características indispensáveis, observações, corretor* (pré-preenchido com o responsável).
- **Verificação de duplicidade** ao abrir: se a conta já tem oportunidade ativa (nova/buscando/visita/proposta), exibe título + etapa, botão "Abrir oportunidade existente" e exige confirmação explícita ("é uma busca realmente diferente") para criar outra.
- **3 resultados** (radio):
  1. **Gerar oportunidade agora** → chama a RPC com chave de idempotência gerada na abertura do modal; botão desabilitado durante o envio.
  2. **Oportunidade futura** → exige data do próximo contato; cria tarefa futura; permite atualizar temperatura; grava `qualificacao_status='oportunidade_futura'`, `destino_comercial='oportunidade_futura'`, `proxima_acao_em`; registra no histórico.
  3. **Não qualificado / cancelar contato** → exige motivo; move para Contato cancelado (mesmos campos do `ContaCancelarDialog`); grava `qualificacao_status='nao_qualificado'`; preserva cadastro e histórico.
- Fechar sem concluir → conta permanece em Contato estabelecido com `qualificacao_status='pendente'`.

## 3. Automação ao mover para Contato estabelecido

- `Accounts.tsx` (`moveStage`): ao mover para `contato_estabelecido`, grava `qualificacao_status='pendente'` (preservando categoria) e abre o `QualificacaoOportunidadeDialog` daquela conta. Nenhuma oportunidade é criada sem confirmação.
- `ContaFluxoAtendimento.tsx`: as ações que movem para Contato estabelecido (2º contato respondido, "Mover para Contato estabelecido") passam a abrir o modal de qualificação em seguida.

## 4. Ação "Qualificar e gerar oportunidade"

- **Card no Kanban** (`ContasKanban.tsx`): novo item no menu de três pontos (visível em Contato estabelecido) e botão "Continuar qualificação" quando `pendente`.
- **Detalhe da conta** (`ContaFluxoAtendimento.tsx`): botão principal da etapa Contato estabelecido passa a ser "Qualificar e gerar oportunidade". O seletor de destino comercial é mantido apenas para compatibilidade/relatórios — deixa de ser o gatilho obrigatório; ao gerar a oportunidade, `destino_comercial` é preenchido automaticamente.

## 5. Indicadores no card da conta

`ContasKanban.tsx` recebe um mapa de oportunidades ativas por conta (buscadas em `Accounts.tsx`) e exibe em Contato estabelecido:
- **Qualificação pendente** (âmbar) + botão "Continuar qualificação";
- **Oportunidade ativa** (verde): título, etapa atual, valor-alvo, corretor e botão que abre a oportunidade;
- **Oportunidade futura** (azul) com data do próximo contato;
- **Não qualificado** (neutro).

Sem nova coluna no funil. Mesmos indicadores no card mobile/lista.

## 6. Navegação nos dois sentidos

- Conta → Oportunidade: `/crm/oportunidades?op=<id>` — `Oportunidades.tsx` passa a ler o parâmetro e abrir o `OportunidadeDetailDialog` automaticamente.
- Oportunidade → Conta: garantir link "Abrir conta vinculada" no `OportunidadeDetailDialog` (adicionar se não existir) apontando para `/crm/contas/<id>`.

## 7. Arquivos alterados/criados

- **Criar**: `src/components/oportunidades/QualificacaoOportunidadeDialog.tsx`; 1 migração SQL.
- **Alterar**: `src/pages/Accounts.tsx` (auto-abertura do modal, mapa de oportunidades, indicadores), `src/components/contas/ContasKanban.tsx` (ação, badges, botão), `src/components/contas/ContaFluxoAtendimento.tsx` (botão principal, gatilho pós-movimentação), `src/pages/Oportunidades.tsx` (deep-link `?op=`), `src/components/oportunidades/OportunidadeDetailDialog.tsx` (link para a conta, se ausente), `src/lib/contasFunil.ts` (labels/helpers de qualificação).
- `CriarOportunidadeDialog.tsx` permanece para criação avulsa na página de Oportunidades, passando a usar a mesma RPC idempotente.

## 8. Testes (via preview + banco)

1. Conta Carteira → Contato estabelecido: modal abre, categoria/corretor preservados, confirma → oportunidade em Nova, conta permanece, card mostra "Oportunidade ativa".
2. Conta Marketing: mesmo fluxo + lead/campanha preservados.
3. Fechar modal sem concluir → "Qualificação pendente" + "Continuar qualificação".
4. Segunda oportunidade: aviso + abrir existente + confirmação explícita.
5. Duplo clique em confirmar e reload durante envio → 1 única oportunidade (chave de idempotência).
6. Oportunidade futura: tarefa criada, sem oportunidade ativa.
7. Não qualificado: conta em Contato cancelado com motivo, histórico completo.
8. Links conta↔oportunidade nos dois sentidos.

Ao final entrego: lista de arquivos/funções alterados, campos criados, RPC criada, IDs dos registros de teste e evidências (oportunidade em Nova, sem duplicidades).
