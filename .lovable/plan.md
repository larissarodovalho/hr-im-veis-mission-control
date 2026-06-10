## Liberar aba Contas (e outras) para usuária marketing com permissão liberada

A migração de RLS já foi aplicada. Falta o frontend:

### 1. `src/components/MarketingRoute.tsx`
Aceitar prop opcional `menuKey`. Se o usuário marketing-only ou secretaria-only tiver override `allowed=true` para aquele menu (via `useMenuAccess`), renderizar a rota em vez de redirecionar.

### 2. `src/App.tsx`
Passar `menuKey` correspondente em cada rota envolvida por `MarketingRoute`: `leads`, `contas`, `whatsapp`, `reunioes`, `ligacoes`, `visitas`, `tarefas`, `documentos`, `contratos`.

### Resultado
Gabriele Nunes (marketing) conseguirá abrir `/crm/contas` e ver/editar todas as contas. Qualquer liberação futura na tela Usuários funcionará da mesma forma.