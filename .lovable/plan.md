## Objetivo

Hoje uma oportunidade guarda `cliente_tipo` (`lead` ou `conta`) + `cliente_id`. Se o corretor cria a oportunidade escolhendo um lead e depois esse lead é convertido em conta, a oportunidade continua apontando para o lead — não aparece na conta do cliente e o funil fica "órfão". A ideia é fazer esse vínculo acontecer sozinho, nos dois momentos possíveis.

## Como funciona a ligação lead ↔ conta

Já existe: `contas.lead_id_origem` aponta para o lead que originou a conta (usado em Leads, LeadDetail, AccountDetail e no relatório de conversão). Vamos usar esse mesmo campo — nada de campo novo.

## Regras propostas

1. **Ao criar/editar uma oportunidade com `cliente_tipo = "lead"`**: se aquele lead já tem uma conta (existe `contas.lead_id_origem = lead.id`), gravar automaticamente `cliente_tipo = "conta"` + `cliente_id = <conta.id>`. O corretor não precisa lembrar de trocar.

2. **Ao converter um lead em conta** (fluxo já existente em `LeadDetail.tsx` linha ~304): logo depois do insert em `contas`, rodar um `UPDATE oportunidades SET cliente_tipo='conta', cliente_id=<nova_conta_id> WHERE cliente_tipo='lead' AND cliente_id=<lead_id>`. Isso migra oportunidades antigas que ficaram apontando para o lead.

3. **Backfill único** (migration de dados): para todas as oportunidades atuais com `cliente_tipo='lead'` cujo lead já tem conta, mover para a conta correspondente. Assim os cards órfãos aparecem na conta certa imediatamente.

4. **Sem duplicar oportunidade**: a oportunidade é a mesma, só troca o cliente vinculado. Não criamos uma segunda oportunidade na conta.

## Onde mudar

- `src/components/imoveis/NovaOportunidadeDialog.tsx`: no `submit()`, antes do insert, se `clienteTipo === 'lead'`, consultar `contas` por `lead_id_origem` e, se existir, sobrescrever para conta.
- `src/components/imoveis/EditarOportunidadeDialog.tsx`: mesma checagem antes do `update`.
- `src/pages/LeadDetail.tsx`: depois do insert da conta (linha ~304), disparar o update em `oportunidades` migrando o vínculo.
- Migration de dados única (uma vez) para regularizar o histórico.

## Pontos que quero confirmar antes de implementar

- **Direção do vínculo**: quero confirmar que a preferência é **sempre migrar lead → conta** (a oportunidade "pertence" à conta). Alternativa seria manter no lead e só *espelhar* na conta — mas isso exige campo novo e complica o Kanban.
- **Oportunidades no estágio `ganha`/`perdida`**: incluir no backfill/migração automática também, ou deixar como estão por serem histórico?
- **Ao editar**: se o corretor manualmente escolher `cliente_tipo = "lead"` para um lead que já tem conta, respeitar a escolha dele ou forçar a conta mesmo assim? Sugestão: forçar (evita erro humano) e mostrar toast "vinculada à conta X do cliente".
