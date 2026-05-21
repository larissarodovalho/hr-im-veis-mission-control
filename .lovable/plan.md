## Sub-aba "Oportunidades de Negócio" em Imóveis

Painel Kanban para registrar demandas ativas de clientes — sejam imóveis que já temos no portfólio ou buscas que precisam ser caçadas.

### Conceito

Uma **Oportunidade** representa um cliente buscando um imóvel. Pode estar vinculada a:
- Um **lead OU uma conta** do CRM (cliente)
- **Zero, um ou vários imóveis** do portfólio (interesses)
- Uma **descrição livre** do que o cliente procura (quando o imóvel ainda não está no portfólio)

### Estágios (colunas do Kanban)

1. **Nova** — recém registrada
2. **Buscando imóvel** — comercial está caçando opções
3. **Visita agendada** — cliente vai ver algum imóvel
4. **Em proposta** — proposta formal em andamento
5. **Ganha** — fechou negócio
6. **Perdida** — cliente desistiu ou comprou em outro lugar

### Banco de dados (migração)

Duas tabelas novas:

**`oportunidades`**
- `cliente_tipo` ('lead' | 'conta') + `cliente_id` (uuid)
- `titulo` (resumo, ex: "Casa 3M no Jardim Europa")
- `descricao_busca` (texto livre do que o cliente quer)
- `valor_alvo` (numeric, opcional)
- `tipo_imovel`, `cidade`, `bairro` (filtros do que busca)
- `estagio` ('nova' | 'buscando' | 'visita' | 'proposta' | 'ganha' | 'perdida'), default 'nova'
- `corretor_id` (responsável)
- `prioridade` ('baixa' | 'media' | 'alta'), default 'media'
- `observacoes`, `created_by`, timestamps

**`oportunidade_imoveis`** (N:N com imóveis do portfólio)
- `oportunidade_id` (FK lógica)
- `imovel_id` (FK lógica)
- `interesse` ('alto' | 'medio' | 'baixo'), opcional
- `observacao` (texto curto)
- unique(oportunidade_id, imovel_id)

RLS: staff vê tudo; corretor vê as próprias + as que criou; admin/gestor vê todas e atualiza qualquer uma.

### Frontend

1. **`src/pages/Imoveis.tsx`** — Adicionar `TabsTrigger value="oportunidades"` (entre "Vendidos" e "Parceiros") e `TabsContent` renderizando o novo componente.

2. **`src/pages/imoveis/OportunidadesTab.tsx`** (novo) — Kanban com as 6 colunas. Header com:
   - Contadores por estágio
   - Botão "Nova oportunidade"
   - Busca por cliente/título
   - Filtro por corretor
   
   Cards mostram: título, nome do cliente (lead/conta), valor alvo, qtd de imóveis vinculados, badge de prioridade, corretor. Drag-and-drop entre colunas atualiza `estagio`.

3. **`src/components/imoveis/NovaOportunidadeDialog.tsx`** (novo) — Formulário com:
   - Toggle Lead/Conta + `SearchableSelect` do cliente
   - Título, descrição da busca, valor alvo
   - Tipo, cidade, bairro desejados
   - Prioridade, corretor responsável
   - Seção "Imóveis do portfólio" com `SearchableSelect` múltiplo (opcional)

4. **`src/components/imoveis/EditarOportunidadeDialog.tsx`** (novo) — Editar campos + gerenciar lista de imóveis vinculados (adicionar/remover + marcar interesse alto/médio/baixo + observação por imóvel).

5. **`src/components/imoveis/OportunidadeCard.tsx`** (novo) — Card do Kanban, com ações: editar, mover estágio, marcar ganha/perdida.

### Detalhes técnicos

- Drag-and-drop: usar `@dnd-kit/core` (já no projeto se disponível; se não, fallback para botões "→ próximo estágio" e dropdown).
- "Ganha" e "Perdida" ficam em colunas separadas com visual de fechamento (verde/cinza).
- Quando a oportunidade vira "Em proposta", **não** cria automaticamente registro em `propostas` — fica como sinalização. (Pode-se adicionar atalho "Criar proposta" depois.)
- Ao excluir um imóvel ou lead/conta, não cascateia — fica registrado na oportunidade com aviso "registro removido".

### Fora do escopo

- Não vou criar workflow automático "oportunidade → proposta" (fica como melhoria futura).
- Não vou alterar a aba "Em Proposta" existente.
- Não vou tocar no fluxo do site público.