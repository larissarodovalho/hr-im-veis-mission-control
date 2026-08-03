# Dashboard: alinhar KPIs com a aba Leads

## Diagnóstico (confirmado nos dados)

**"Sem atendimento (3d+) = 44"** — o Dashboard usa uma regra própria e desatualizada: qualquer lead fora de Fechado/Perdido com 3+ dias sem interação. Dos 44:
- **11 são leads já convertidos em Conta** — eles saíram do funil de Leads (a aba Leads esconde convertidos do kanban), mas o Dashboard continua contando como "sem atendimento";
- a regra também ignora a regra de negócio atual: **lead com tarefa futura agendada = atendimento programado**, não "sem atendimento" (hoje nenhum lead tem tarefa futura, mas a regra precisa valer).

**"Perdidos = 7"** — está **correto e consistente** com a aba Leads: são 7 leads marcados como Perdido pela equipe entre 22/jun e 13/jul (Gerson Borges, Rodrigo Watanabe, Elaine, Dra Marine, Rafael Castilho, Raphael Bragagnolo, Tiago Pacheco), depois que "Perdido" virou coluna ativa do kanban. Não é erro nem dado legado.

**"Em atendimento = 12"** — conta só "Em Contato" + "Conversa Ativa". A aba Leads e o relatório consideram as 4 etapas ativas do funil (Novo Lead, Pré-atendimento, Em Contato, Conversa Ativa = 54).

## Mudanças (somente `src/pages/Dashboard.tsx`)

1. **Buscar os mesmos dados da aba Leads**: `contas.lead_id_origem` (convertidos) e tarefas pendentes com prazo de leads (`nextTaskMap`, igual à aba Leads).
2. **"Sem atendimento (3d+)"** passa a usar a regra da aba Leads ("Precisam nutrição"): exclui convertidos em conta e exclui leads com tarefa futura agendada. Resultado esperado: **~33** (44 − 11 convertidos). A lista "Leads atrasados" logo abaixo usa o mesmo filtro e fica alinhada automaticamente.
3. **"Em atendimento"** passa a contar as 4 etapas ativas do funil (`ETAPAS_ATIVAS_FUNIL`): **54**, igual ao relatório Funil de Leads.
4. **Novo KPI "Convertidos em conta"** (19) com link para Contas — deixa explícito para onde foram os leads que saíram do funil (hoje eles "inflam" o Total e sumiam da visão).
5. **"Perdidos"**: sem alteração de regra (7 é o valor real da coluna Perdido).

## Detalhes técnicos

- Reaproveitar helpers existentes: `daysSince`/`idleDays` de `src/lib/leads.ts`, `ETAPAS_ATIVAS_FUNIL` e padrão de query de tarefas de `src/pages/Leads.tsx`.
- Critério de ociosidade idêntico ao da aba Leads (dias corridos no fuso America/Cuiaba).
- Nenhuma mudança de banco, RLS ou outras páginas.

## Validação

- Playwright: conferir KPIs (~33 sem atendimento, 54 em atendimento, 7 perdidos, 19 convertidos) e que a lista "Leads atrasados" não mostra mais convertidos (ex.: Cleyton/Simone se forem convertidos).
- Typecheck limpo.
