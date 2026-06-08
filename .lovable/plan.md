## Objetivo
Registrar pageviews das páginas públicas do site (`/site/*`) e exibir um gráfico de acessos diários (últimos 30 dias) no Dashboard, no mesmo estilo do gráfico de leads.

## 1. Banco de dados (migration)
Criar tabela `public.site_visits`:
- `path` (text) — rota visitada
- `referrer` (text, nullable)
- `user_agent` (text, nullable)
- `session_id` (text) — id anônimo gerado no browser (localStorage), para distinguir visitantes
- `country` / `city` (text, nullable, opcional via header)
- `created_at` (timestamptz default now())

Índice em `created_at` para agregações rápidas.

RLS:
- INSERT liberado para `anon` e `authenticated` (qualquer visitante registra acesso).
- SELECT apenas para `admin` e `gestor` (via `is_admin()`).
- GRANT INSERT para anon/authenticated; GRANT SELECT para authenticated; GRANT ALL para service_role.

Função `public.get_site_visits_daily(days int)` (SECURITY DEFINER, restrita a admin/gestor) retornando `(dia date, visitas bigint, visitantes_unicos bigint)` para os últimos N dias — facilita a query do dashboard.

## 2. Tracking no site público
Criar hook `useTrackPageview()` em `src/lib/siteAnalytics.ts`:
- Gera/recupera `session_id` em `localStorage` (`hr_sid`).
- Em cada mudança de rota dentro de `SiteLayout`, faz `supabase.from('site_visits').insert({ path, referrer, user_agent, session_id })`.
- Fire-and-forget, sem bloquear UI; ignora erros silenciosamente.
- Não rastreia rotas do CRM (apenas `/site/*` e `/`).

Integrar o hook no `src/components/site/SiteLayout.tsx`.

## 3. Dashboard — gráfico de acessos
Em `src/pages/Dashboard.tsx`:
- Novo card "Acessos ao site (últimos 30 dias)" ao lado/abaixo do gráfico de leads.
- Visível apenas para `admin`/`gestor` (usa `useAuth().roles`).
- Busca via `supabase.rpc('get_site_visits_daily', { days: 30 })`.
- Recharts `LineChart` ou `BarChart` mostrando visitas por dia; tooltip com total + visitantes únicos.
- KPIs no topo do card: total 30 dias, total hoje, visitantes únicos 30 dias.

## Detalhes técnicos
- Stack: tabela em Lovable Cloud, função SQL agregadora, hook React no SiteLayout, Recharts no Dashboard.
- Sem dependências novas (Recharts já está no projeto).
- Sem edge function — insert direto via cliente Supabase com RLS.
- Privacidade: não armazenamos IP nem dados pessoais; `session_id` é aleatório local.

## Fora de escopo
- Mensal/12 meses (pode ser adicionado depois).
- GA4 ou Plausible.
- Detalhamento por imóvel/landing page específica.