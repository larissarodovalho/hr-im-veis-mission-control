## Trazer especificações da aba Leads do Brazil Lands

A aba Leads atual já tem kanban + lista + busca + criação com detecção de duplicidades. Vou portar as melhorias que existem no Brazil Lands e que **faltam aqui**, mantendo as etapas (`Prospecção`, `Qualificação`, etc.) e o schema atual (`leads.nome/telefone/email/etapa_funil/...`) intactos.

### O que será adicionado

1. **Badges de tempo nos cards e na lista**
   - **📅 Idade na base** — dias desde `created_at` (helpers `ageInDays`, `ageLabel`, `ageColor`).
   - **⏱️ Tempo sem contato** — dias desde `ultima_interacao` (helpers `idleDays`, `idleLabel`, `idleColor`).
   - Substitui/complementa o badge único de SLA atual com cores graduais (verde → amarelo → laranja → vermelho).

2. **Filtro "Precisam nutrição"**
   - Botão com ícone de chama 🔥 ao lado dos controles de view.
   - Mostra leads sem contato há **4+ dias** ou **nunca contactados**, ignorando os que estão em `Fechamento`/`Perdido`.
   - Badge com a contagem em tempo real.

3. **Ordenação na visualização de lista**
   - Select com "Mais recentes" (padrão) e "Mais antigos sem contato".
   - Aparece somente no modo lista.

4. **Layout responsivo da lista**
   - Mobile: cards verticais (atualmente só tem tabela, que estoura no celular).
   - Desktop: tabela existente, com as duas badges de tempo na coluna "Tempo".

5. **Header responsivo**
   - Controles quebram em múltiplas linhas no mobile (busca em largura total, depois view/filtros).

6. **Ajuste no `NewLeadDialog`** (opcional, pequeno)
   - Após criar o lead, dispara `supabase.functions.invoke("notify-new-lead", ...)` se existir — caso contrário ignora silenciosamente. _Nota: vou checar se essa edge function existe aqui antes de incluir; se não, removo essa parte._

### O que NÃO muda

- **Schema do banco** — campos atuais (`nome`, `telefone`, `email`, `etapa_funil`, `ultima_interacao`, etc.) permanecem.
- **Etapas do funil** — continuam `Prospecção / Qualificação / Apresentação / Visita / Proposta / Negociação / Fechamento / Perdido`.
- **Detecção de duplicidades** — já existente, será preservada.
- **Realtime, drag-and-drop, criação de lead** — preservados.
- **`LeadDetail.tsx`** — sem alterações nesta tarefa.

### Arquivos editados

- `src/lib/leads.ts` — adicionar `ageInDays`, `idleDays`, `ageLabel`, `ageColor`, `idleLabel`, `idleColor`, `formatDateBR`.
- `src/pages/Leads.tsx` — adicionar filtro nutrição, ordenação, layout responsivo, badges de tempo no kanban e lista.

### Detalhes técnicos

- Filtro nutrição usa `idleDays(l.ultima_interacao)`; `null` (nunca contactado) é incluído.
- A tipagem `Lead` existente já contém `ultima_interacao` e `created_at` — sem mudança de tipos.
- Cores das badges usam tokens semânticos do design system (`success`, `warning`, `danger`, `muted`) — sem cores diretas.