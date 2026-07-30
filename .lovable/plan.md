# Integrar destino comercial "Captação / Reunião" com a aba Captação (Imóveis)

## Objetivo
Quando uma conta em **Contato estabelecido** receber o destino comercial **"Captação / Reunião"** (`captacao_reuniao`), um card de captação deve ser criado automaticamente na aba **Imóveis > Captação** (tabela `captacoes_imovel`), iniciando no estágio "Novo (recebido)".

## Estado atual (verificado)
- A tabela `captacoes_imovel` e a aba Captação já existem e funcionam.
- O trigger `sync_captacao_from_conta` só dispara quando `contas.etapa_funil = 'captacao_imovel'` — etapa legada que não existe mais no funil novo. Ou seja, hoje **nenhum card novo é criado** pelo fluxo de Contato estabelecido.
- O destino comercial é salvo em `contas.destino_comercial` pelo botão "Definir destino comercial" em `ContaFluxoAtendimento.tsx` (valores permitidos pela constraint: `captacao_reuniao`, `comprar_oportunidade`, `vender_hrx_producoes`, `oportunidade_futura`).
- O texto de ajuda da aba Captação ainda diz "Cards criados automaticamente quando uma conta entra em 'Captação/Imóvel'" (desatualizado).

## Implementação

### 1. Migration — atualizar o trigger de sincronização
- Reescrever a função `public.sync_captacao_from_conta()` para criar o card em **duas** condições:
  - `etapa_funil = 'captacao_imovel'` (comportamento legado, mantido); **ou**
  - `destino_comercial = 'captacao_reuniao'` (novo), quando o valor acabou de mudar para esse destino.
- Recriar o trigger para observar as duas colunas: `AFTER INSERT OR UPDATE OF etapa_funil, destino_comercial ON public.contas`.
- **Sem duplicidade**: só insere se não existir captação ativa (`estagio <> 'concluido'`) para a conta — mesmo padrão já usado hoje.
- O card nasce com `estagio = 'novo'`, `responsavel_id` e `created_by` herdados da conta.
- **Reversão segura**: se o destino sair de `captacao_reuniao` para outro, remover apenas cards "intocados" (ainda em `novo`, sem data agendada, sem checklist, sem imóvel vinculado). Cards já trabalhados permanecem.
- **Backfill**: criar cards para contas que já estão hoje com `destino_comercial = 'captacao_reuniao'` e não têm captação ativa.

### 2. Ajustes de frontend
- `src/pages/imoveis/CaptacaoTab.tsx`: atualizar o texto de ajuda para refletir a nova regra ("Cards criados automaticamente quando uma conta em Contato estabelecido recebe o destino comercial 'Captação / Reunião'").
- `src/components/contas/ContaFluxoAtendimento.tsx`: ao salvar o destino `captacao_reuniao`, mostrar no toast que a conta foi enviada para a aba Captação em Imóveis.

## Notas técnicas
- A criação acontece 100% no banco (trigger), então funciona independentemente de onde o destino for alterado (fluxo de atendimento, edição futura etc.).
- RLS de `captacoes_imovel` já permite que o responsável/criador da conta veja e edite o card — nenhuma policy nova é necessária.
- A aba Captação já tem realtime subscription; o card novo aparece sem recarregar a página.

## Validação
- Definir destino "Captação / Reunião" numa conta em Contato estabelecido → conferir card na aba Captação no estágio "Novo (recebido)".
- Repetir a ação → confirmar que não duplica.
- Mudar o destino para outro → card intocado some; card já trabalhado permanece.
- Verificar o backfill nas contas já marcadas com esse destino.