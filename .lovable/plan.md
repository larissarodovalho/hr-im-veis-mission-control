O Dashboard em `src/pages/Dashboard.tsx` filtra os leads através de um `Set` chamado `CAMPAIGN_SOURCES` (linha 17). Atualmente ele só reconhece as origens:
- meta_ads
- google_ads
- ia_chat
- webhook
- whatsapp

Por isso leads vindos de "site" ou "indicacao" não entram nos KPIs nem nos gráficos, o que causa diferença entre o total exibido no dashboard e o total da aba "Leads".

**O que vai ser feito:**

1.  **Ajustar o filtro** em `src/pages/Dashboard.tsx`:
    - Adicionar as strings `"site"` e `"indicacao"` ao `CAMPAIGN_SOURCES`.
    - Opcionalmente atualizar o comentário ao lado do `Set` para refletir a inclusão de leads orgânicos.

**Arquivo alterado:**
- `src/pages/Dashboard.tsx` (linha 17)

**Sem mudanças em:** banco de dados, layout, rotas ou outros componentes.