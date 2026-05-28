## Objetivo

Exibir, em cada agendamento da agenda (`/crm/agenda`), o nome do usuário que criou o compromisso.

## Situação atual

Os compromissos da agenda são montados em `src/pages/Schedule.tsx` a partir de 4 tabelas — `reunioes`, `ligacoes`, `visitas` e `captacoes_imovel` — e todas já possuem a coluna `created_by`. Porém:
- As consultas não selecionam `created_by`.
- O tipo `Compromisso` não tem campo para o criador.
- Os cartões de evento não mostram essa informação.

Os nomes dos usuários ficam na tabela `profiles` (`user_id` → `nome`).

## Mudanças (somente em `src/pages/Schedule.tsx`)

1. **Tipo `Compromisso`**: adicionar `criado_por_id?: string | null` e `criado_por_nome?: string | null`.

2. **Consultas (`load`)**: incluir `created_by` no `.select(...)` das 4 tabelas (reunioes, ligacoes, visitas, captacoes_imovel).

3. **Buscar nomes dos criadores**: coletar todos os `created_by` distintos dos 4 conjuntos, consultar `profiles` (`id/user_id, nome`) e montar um `Map<user_id, nome>` (mesmo padrão já usado para `leadsById`/`contasById`).

4. **Mapeamento dos eventos**: preencher `criado_por_id` e `criado_por_nome` em cada compromisso (reuniões, ligações, visitas e captações).

5. **Exibição**: no painel de detalhes do dia (área das linhas ~1173-1183, onde já aparecem "Lead:"/"Cliente:"/notas), adicionar uma linha discreta:
   `Criado por: <nome>` (usando `text-xs text-muted-foreground`). Quando o nome não existir, mostrar "—" ou omitir.

## Observações

- Sem alterações de banco, RLS ou edge functions — `created_by` já existe e o staff já enxerga esses registros na agenda.
- Como a leitura de `profiles` depende das policies atuais, validaremos que os nomes aparecem; se algum não resolver, exibimos o fallback "—".

## Decisão pendente

Onde mostrar o criador:
- **(A) Apenas no painel de detalhes** do dia (recomendado, menos poluição visual).
- **(B) Também nos blocos compactos** do calendário (mês/semana), via tooltip.

Vou seguir com a opção A, salvo indicação contrária.
