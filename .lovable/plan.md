## Ajuste de rotas do domínio

**Objetivo:** facilitar o acesso dos clientes ao site público e dos colaboradores ao CRM.

### Comportamento atual
- `hrimoveis.com/` → página `Landing` (institucional intermediária)
- `hrimoveis.com/site` → site público
- `hrimoveis.com/app` → CRM

### Comportamento desejado
- `hrimoveis.com/` → **site público** (HomePage, direto)
- `hrimoveis.com/crm` → **CRM** (área logada)
- Demais páginas do site sem o prefixo `/site`:
  - `/imoveis`, `/imovel/:id`, `/sobre`, `/contato`

### Mudanças
1. **`src/App.tsx`**
   - Trocar a rota `/` para renderizar `SiteLayout` + `HomePage` (no lugar do `Landing` atual).
   - Mover as rotas do site de `/site/*` para a raiz:
     - `/imoveis`, `/imovel/:id`, `/sobre`, `/contato`
   - Renomear a rota do CRM de `/app` para `/crm` (mantendo todas as sub-rotas: `/crm/leads`, `/crm/contas`, `/crm/imoveis`, etc.).
   - Manter redirects das rotas antigas para não quebrar links existentes:
     - `/site` → `/`
     - `/site/imoveis` → `/imoveis`
     - `/site/imovel/:id` → `/imovel/:id`
     - `/site/sobre` → `/sobre`
     - `/site/contato` → `/contato`
     - `/app/*` → `/crm/*`

2. **`src/components/site/SiteLayout.tsx`**
   - Atualizar os `navLinks` para apontar para as novas URLs (`/`, `/imoveis`, `/sobre`, `/contato`).
   - Atualizar o logo (link do header) e o CTA "Fale Conosco".

3. **`src/components/AppLayout.tsx`**
   - Atualizar todos os itens da sidebar de `/app/...` para `/crm/...`.

4. **Outros pontos com links hardcoded** (varrer e atualizar):
   - `src/pages/Landing.tsx` (caso ainda seja referenciado em algum lugar — pode ser removido das rotas).
   - Componentes do site que navegam para `/site/imovel/:id`, `/site/imoveis` etc. (ex.: `HomePage`, `ImoveisPage`, `ImovelDetalhePage`, `ContatoPage`, `SobrePage`).
   - Qualquer `useNavigate("/app...")` ou `<Link to="/app...">` no CRM.

### Observações
- A página `Landing` deixa de ser usada na navegação principal. Posso removê-la do roteamento ou manter acessível em `/landing` — me avise a preferência (por padrão, vou remover do menu mas manter o arquivo).
- SEO: o `canonical` e `og:url` no `index.html` continuam apontando para `https://hrimoveis.com/`, o que passa a bater com a nova home (o site público). Sem ajustes adicionais necessários.
- Sem mudanças de backend, autenticação ou lógica de negócio — apenas roteamento e links.
