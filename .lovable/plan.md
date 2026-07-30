# Verificação do fluxo Lead → Conta → Oportunidade

## Resultado: nenhuma alteração necessária

A verificação do código confirmou que o fluxo comercial funciona exatamente como o esperado, e o usuário confirmou que não deseja ajustes nas nuances encontradas.

## Fluxo verificado (funcionando)

```text
Leads (Conversa Ativa)
   │  botão "Conta Cliente"
   ▼
Contas > Marketing > A contatar
   │  tentativas de contato (Contatado / Sem retorno)
   ▼
Contato estabelecido  →  modal de Qualificação abre automaticamente
   │
   ├─ Gerar agora ────────────► Oportunidades de Negócio > Nova
   ├─ Oportunidade futura ────► agenda tarefa de retomada
   └─ Não qualificado ────────► Contato cancelado (com motivo)
```

## Pontos confirmados no código

- Conversão do lead (`LeadDetail.tsx`): cria conta com `categoria = marketing`, `etapa_funil = a_contatar`, vincula `lead_id_origem`, migra interações e redireciona para `/crm/contas?lista=marketing`; o lead some do funil de Leads.
- Entrada em Contato estabelecido (`Accounts.tsx` e `ContaFluxoAtendimento.tsx`): marca `qualificacao_status = pendente` e abre o modal de qualificação automaticamente, tanto pelo Kanban quanto pelo fluxo dentro da conta.
- Qualificação (`QualificacaoOportunidadeDialog.tsx` + RPC `criar_oportunidade_qualificada`): cria a oportunidade na etapa Nova vinculada à conta e ao lead de origem, com prevenção de duplicidade (aviso de oportunidade ativa + idempotência por chave) e registro no histórico de interações.

## Nuances aceitas pelo usuário (sem mudança)

1. Botão "Conta Cliente" disponível em qualquer etapa do lead (não restrito a Conversa Ativa).
2. Conversão de lead sempre cai em Marketing (sem opção de Carteira direta).
3. Após gerar a oportunidade, a conta permanece em Contato estabelecido com o selo "Oportunidade ativa".
4. O modal de qualificação pode ser fechado sem concluir; a conta fica pendente com badge no Kanban.

## Ação

Nenhuma alteração de código, banco ou configuração será feita.