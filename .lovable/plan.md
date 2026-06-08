O Dashboard em `src/pages/Dashboard.tsx` ainda restringe os KPIs e gráficos a leads que estejam no `CAMPAIGN_SOURCES`. Como no banco existem leads de origem `manual` (Elizeu Tremarin, Dra daiana) e só o `meta_ads` (Gerson Borges) entra no filtro, o dashboard exibe apenas 1 lead quando a aba Leads mostra 2.

**O que vai ser feito:**

1. **Remover o filtro de origens** em `src/pages/Dashboard.tsx`:
   - Apagar a constante `CAMPAIGN_SOURCES`.
   - Substituir `campaignLeads` por `leads` em todos os KPIs, gráficos e cálculos subsequentes (tendência, reuniões, origem, etapa, atrasados etc.).
   - Remover `campaignLeadIds` e usar `leads`/`leadIds` diretamente.

**Arquivo alterado:**
- `src/pages/Dashboard.tsx`

**Sem mudanças em:** banco de dados, layout, rotas ou outros componentes.