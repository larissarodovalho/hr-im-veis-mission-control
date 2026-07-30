# Histórico de interações do lead deve acompanhar a conversão em conta

## Diagnóstico (confirmado no banco)

A conversão Lead → Conta (`src/pages/LeadDetail.tsx`, dois caminhos: "Conta Cliente" linha 456-461 e "Desclassificar" linha 259-260) tenta vincular as interações à nova conta com um UPDATE no navegador:

```ts
await supabase.from("interacoes")
  .update({ conta_id: created.id })
  .eq("lead_id", lead.id)
  .is("conta_id", null);
```

**Por que falha:** a policy de UPDATE de `interacoes` (`Author or admin updates interacoes`) só permite alterar interações que a própria pessoa criou (ou admin/gestor). Quando um corretor converte um lead cujas interações foram criadas por outra pessoa (IA, gestor, outro corretor), o UPDATE não afeta nenhuma linha — e falha **silenciosamente**, sem erro. As interações ficam com `conta_id = NULL` e não aparecem na timeline da conta.

**Evidência nos dados:** a conta "Larissa Freitas" tem 1 interação do lead de origem ainda pendente (`conta_id` nulo). As demais contas convertidas migraram porque quem converteu era o autor das interações ou admin.

A timeline da conta (`ContaInteracoesTimeline.tsx`) já busca por `conta_id` — ou seja, resolvido o vínculo, o histórico aparece sem mexer na UI.

## O que será feito

### 1. Migration: trigger no banco (solução definitiva)
- Função `SECURITY DEFINER` `migrar_interacoes_para_conta()` + trigger `AFTER INSERT` em `contas`.
- Quando uma conta nasce com `lead_id_origem`, vincula automaticamente todas as interações daquele lead (`conta_id = NEW.id` onde `lead_id = NEW.lead_id_origem AND conta_id IS NULL`).
- Por rodar no banco com privilégio elevado, funciona independentemente de quem converte ou de quem criou as interações — cobre os dois caminhos de conversão (Conta Cliente e Desclassificar) e qualquer futuro.
- As interações mantêm o `lead_id`, então o histórico continua visível também na tela do lead.

### 2. Backfill dos registros pendentes
- Um único UPDATE vinculando interações órfãs de todas as contas já convertidas (corrige o caso da Larissa Freitas e qualquer outro).

### 3. Limpeza no frontend
- Remover os dois UPDATEs client-side em `LeadDetail.tsx` (linhas 259-260 e 456-461), agora redundantes — o trigger executa na mesma transação do insert da conta. Mantido o registro da nota de desclassificação.

## Verificação
- Query confirmando que nenhuma conta convertida fica com interações pendentes.
- Abrir a conta "Larissa Freitas" e conferir a interação migrada na timeline.
- Simular conversão de um lead com interações de outro autor e confirmar que o histórico aparece na conta.

## Fora de escopo
- Nenhuma mudança visual na timeline ou nas telas (não é necessário).
- Interações criadas **depois** da conversão já são registradas direto na conta.