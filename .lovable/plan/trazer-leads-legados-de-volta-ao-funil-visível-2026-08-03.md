# Trazer leads "legados" de volta ao funil visível

## Decisões (do usuário)
- Etapas com leads voltam como **colunas visíveis no Kanban**, ao lado das 4 atuais.
- Os 26 leads **"Perdido"** (não convertidos) voltam para **etapa ativa** para retrabalho.

## O que muda

### 1. Funil Kanban passa a ter 7 colunas (`src/lib/leads.ts`)
As etapas "Perdido", "Permuta" e "Manual de acompanhamento" saem da classificação "legada" e viram colunas normais do funil:

```text
Novo Lead | Pré-atendimento | Em Contato | Conversa Ativa | Manual de acomp. | Permuta | Perdido
```

- `STAGES`/`ActiveStage` passam a incluir as 3 etapas; `LEGACY_STAGES` fica só com as etapas sem leads visíveis (IA de acompanhamento, Reunião Agendada, Visita, Proposta, Fechado) — mantidas apenas para exibição histórica na visão Lista.
- Efeito automático: o sufixo "(legado)" some desses leads, o chip "em etapas legadas" zera e se esconde, e eles voltam a contar no funil, no filtro "Precisam nutrição" e nos relatórios.

### 2. Migração de dados (SQL)
- Os 26 leads em "Perdido" que **não viraram Conta** → movidos para **"Pré-atendimento"** (retrabalho).
- Os 7 "Perdido" já convertidos em Conta ficam como estão (histórico, já fora do funil).

### 3. Ajustes finos
- `src/pages/Leads.tsx`: nada estrutural — o Kanban já renderiza todas as etapas de `STAGES`; a ordenação das colunas segue a lista acima. Visão Lista e filtros continuam funcionando.
- `src/pages/LeadDetail.tsx` / `FunilLeadsReport.tsx`: sem mudança de código — o comportamento acompanha a nova classificação automaticamente (esses leads deixam de ser tratados como "encerrados/legados").

## Validação
- Conferir no banco: 0 leads visíveis em etapas fora do funil.
- Testar no navegador: Kanban mostra as 7 colunas; "Pré-atendimento" recebe os 26; Permuta (3) e Manual (1) aparecem como colunas; chip de legados desaparece.
