# Check de pontualidade nas tentativas de contato (Leads)

Hoje cada tentativa (mensagem na entrada, áudio em +24h, ligação em +48h) vira uma linha em `interacoes` com `created_at` no momento do registro, mas nada registra se o atendente cumpriu o cronograma. Vamos classificar cada tentativa feita como **adiantada**, **no prazo** ou **atrasada**, gravar isso no banco e exibir o check no card de tentativas e no histórico.

## Régua de pontualidade (conforme sua escolha)

Comparando a data/hora do registro com o vencimento da tentativa:

- **✓ No prazo** — registrada até 1h após o vencimento (ex.: áudio vencia 14h → registrar até 15h conta como no prazo)
- **Adiantada** — registrada mais de 1h antes do vencimento (vale para áudio/ligação; mostra "Xh antes do prazo")
- **Atrasada** — registrada mais de 1h após o vencimento (mostra "Xh de atraso")

## Passos

1. **Migration no banco** (`interacoes`)
   - Nova coluna `pontualidade TEXT` (valores: `adiantada`, `no_prazo`, `atrasada`; nula para interações que não são tentativa).
   - Backfill: para todas as interações de tentativa já existentes (tipo `mensagem`/`audio`/`ligacao` ligadas a lead), calcular a pontualidade retroativamente a partir de `created_at` da interação vs. entrada do lead + prazo da tentativa.

2. **`src/lib/leads.ts`**
   - Adicionar metadados de pontualidade (label, emoji, cor) e o helper `tentativaPontualidade(prazo, feitaEm)` que aplica a régua acima e retorna também o detalhe ("2h de atraso", "5h antes do prazo").

3. **`src/pages/LeadDetail.tsx`**
   - No `registerTentativa`: calcular a pontualidade no momento do registro e gravar o campo `pontualidade` junto da interação.
   - No card **Tentativas de contato**: cada tentativa já feita passa a exibir o selo — verde "✓ no prazo", âmbar "adiantada · Xh antes", vermelho "atrasada · há X" (com tooltip mostrando data/hora do registro e do vencimento).
   - No **histórico de interações**: a linha da tentativa ganha o mesmo selo quando `pontualidade` estiver presente.

4. **`src/components/contas/ContaInteracoesTimeline.tsx`**
   - Como o histórico migra do lead para a conta na conversão, exibir o mesmo selo na timeline da conta (visível também depois de virar conta).

## Detalhes técnicos

- Ordem: migration primeiro (você aprova), depois o código (os tipos do banco são regenerados automaticamente após a migration).
- Sem mudança de RLS/permissões — só coluna nova em tabela existente.
- Funciona retroativamente: tentativas antigas já ganham o selo via backfill.
- Como fica gravado no banco, abre caminho para um futuro relatório de pontualidade por corretor (fora deste escopo).
