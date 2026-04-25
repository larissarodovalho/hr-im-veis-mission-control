## O que peguei do Brazil Lands

O CRM deles é mais maduro em **gestão de relacionamento** (Leads → Contas → Interações) do que o nosso, que hoje é mais forte em **operação imobiliária** (Imóveis, Visitas, Propostas). Estes são os pontos que valem trazer:

### Estruturalmente eles têm e nós não

| Brazil Lands | Já temos? | Vale trazer? |
|---|---|---|
| **Contas** (cliente convertido a partir de lead) | Não — só `contatos` solto | Sim |
| **Detalhe de Lead** com timeline de interações | Não — só lista/kanban | Sim |
| **Interações** (ligação, mensagem, visita, reunião, nota, email) com resultado | Parcial (`lead_historico` mas não usado na UI) | Sim |
| **Reuniões** com status (agendada/realizada/no-show) | Não | Sim |
| **Ligações** registradas | Não | Sim |
| **Captura pública** (`/captura`) que cria lead | Não | Opcional, deixar pra depois |
| Kanban com **@dnd-kit** (mais robusto que HTML5 nativo) | Temos drag nativo | Sim, refatorar |
| Tags de **temperatura** (frio/morno/quente) e **SLA** (dias sem contato com cor) | Não | Sim |

### Onde nós já estamos melhores
Imóveis com fotos/storage, propostas formais, campanhas de tráfego, conteúdo, redes sociais, agentes/bots, health, settings. Isso fica como está.

---

## Plano de implementação

### 1. Banco — novas tabelas e enriquecimento

**Novas tabelas:**
- `contas` — cliente "convertido" (PF ou PJ): nome, doc, tipo, lead_id de origem, responsavel_id, created_by, observações
- `interacoes` — polimórfica em lead OU conta: `lead_id`, `conta_id`, `tipo` (ligacao/mensagem/visita/reuniao/email/nota), `resultado`, `descricao`, `proxima_acao`, `agendado_para`, `created_by`
- `reunioes` — `lead_id`, `agendada_para`, `local`, `link`, `status` (agendada/realizada/no_show/cancelada), `notas`, `corretor_id`
- `ligacoes` — `lead_id`, `data`, `duracao_seg`, `resultado`, `gravacao_url`, `notas`, `corretor_id`

**Enriquecer `leads`:**
- `temperatura` text ('frio'|'morno'|'quente')
- `regiao` text
- (já temos `ultima_interacao`, então o SLA sai dali)

**RLS:** mesmo padrão atual — admin/gestor veem tudo, corretor vê o que é dono ou criou.

### 2. UI nova

- **Sub-aba "Contas"** dentro do `/crm` ao lado de Leads — lista + criar + detalhe simples
- **Página `LeadDetalhe`** (`/crm/lead/:id`) com: header do lead, abas (Visão geral, Interações, Reuniões, Ligações, Visitas, Propostas, Notas, Tarefas), botão "Converter em Conta"
- **Refatorar `LeadsTab` Kanban** usando `@dnd-kit/core` (instalar) — drag mais suave, melhor mobile
- **Badges visuais** no card do lead: temperatura (🧊/🌤️/🔥) e SLA por cor (verde <3d, amarelo 3-7d, vermelho >7d)
- **Modal "Registrar interação"** rápido a partir do card / detalhe — atualiza `ultima_interacao` automaticamente

### 3. O que NÃO vou copiar agora
- Captura pública (`/captura`) — esperar você pedir
- Página de Reuniões/Ligações standalone no menu lateral — vão viver dentro do detalhe do lead, evita inflar o menu
- IA pública de chat na landing — fora de escopo

### 4. Arquivos afetados
- `supabase/migrations/<novo>.sql` — tabelas + enum + colunas + RLS + triggers + index
- `src/components/LeadsTab.tsx` — trocar drag nativo por @dnd-kit, adicionar temperatura/SLA
- `src/components/ContasTab.tsx` — novo
- `src/pages/LeadDetalhe.tsx` — novo
- `src/components/InteracaoDialog.tsx`, `ReuniaoDialog.tsx`, `LigacaoDialog.tsx` — novos
- `src/pages/CRMPage.tsx` — adicionar aba "Contas" e roteamento pro detalhe
- `src/lib/leads.ts` — helpers (stages, temperatura, SLA color) inspirados nos deles
- `package.json` — `@dnd-kit/core`

### 5. Detalhes técnicos
- Conversão Lead → Conta: cria registro em `contas` com `lead_id_origem` setado e marca `etapa_funil = 'Fechamento'` no lead
- SLA helper: `daysSince(ultima_interacao)` → `< 3 verde`, `3-7 amarelo`, `> 7 vermelho`
- Realtime: assinar `postgres_changes` em `leads` e `interacoes` na página de detalhe
- @dnd-kit substitui o `draggable`/`onDrop` HTML5 atual em `LeadsTab` mantendo a mesma `handleDrop` que faz `updateLead({ etapa_funil })`