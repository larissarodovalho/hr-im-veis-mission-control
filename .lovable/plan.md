# Estrutura atual do funil da aba Leads

Referência do estado atual, conforme solicitado — nenhuma alteração será feita até você dizer o que quer mudar.

## Colunas do funil (ordem atual no Kanban)

Definidas em `src/lib/leads.ts` (constante `STAGES`):

```text
1. Novo Lead
2. Em Contato
3. Conversa Ativa
4. 🤖 IA de acompanhamento
5. 👤 Manual de acompanhamento
6. Reunião Agendada
7. Visita
8. Proposta
9. Permuta
10. Fechado
11. Perdido
```

## Como os leads entram no funil

| Origem | Etapa inicial |
|---|---|
| Cadastro manual (botão "Novo lead") | `Novo Lead` (padrão do banco) |
| Formulário do site | `Novo Lead` |
| Webhook Meta Lead Ads | `Novo Lead` (ou etapa configurada no mapeamento do formulário Meta) |
| Chat público IA | `Novo Lead` |
| Lead duplicado reativado | volta para `Novo Lead` |

## Regras e comportamentos ligados ao funil

- **Movimentação**: arrastar e soltar no Kanban ou seletor de etapa na página de detalhe do lead.
- **Etapas finais**: `Fechado` e `Perdido` são tratadas como "encerradas" — ficam fora do filtro "Precisam nutrição" e desabilitam o follow-up por IA.
- **Conversão em conta**: ao qualificar o lead como conta, ele sai da aba Leads e nasce em Contas › Marketing na coluna "A contatar" (etapa do funil de contas = `a_contatar`), com o histórico de interações migrado.
- **Filtro "Precisam nutrição"**: leads fora de Fechado/Perdido sem interação há 4+ dias.
- **Follow-up IA**: disponível para leads fora das etapas finais, sem contato há 3+ dias e com telefone.
- **Badge "🔥 Contato Imediato"**: exibida quando o lead tem a tag `urgente` (há também uma referência legada a uma etapa "Contato Imediato" que não existe mais como coluna).
- **Temperatura** (independente da etapa): Frio 🧊 / Morno 🌤️ / Quente 🔥.

## Relação com o funil de Contas (para comparação)

O funil da aba Contas (`src/lib/contasFunil.ts`) é separado:

```text
A contatar → Contatado → Sem retorno → Contato estabelecido →
Captação/Imóvel → Reunião → Visita → Permuta → Proposta →
Fechado → Oportunidade futura → Parceiros
```

## Próximo passo

Me diga quais alterações você quer no funil de Leads (renomear, reordenar, adicionar ou remover colunas, mudar regras de entrada/saída) e eu atualizo este plano com a implementação.