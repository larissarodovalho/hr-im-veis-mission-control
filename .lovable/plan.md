# Corrigir rota /app/configuracoes

**Problema encontrado:** a rota `/app/configuracoes` em `src/App.tsx` (linha 84) está renderizando o componente antigo `<Settings />` (de `src/pages/Settings.tsx`), que mostra apenas "Backend" e "Sobre". Por isso todas as edições que fizemos em `src/pages/ConfiguracoesPage.tsx` (Backup & Recuperação, Webhook captação, WhatsApp, IA, Landing) não aparecem — esse arquivo nunca é carregado.

## Correção

Em `src/App.tsx`:

1. Trocar o import (linha 29):
   ```ts
   // antes
   import Settings from "@/pages/Settings";
   // depois
   import ConfiguracoesPage from "@/pages/ConfiguracoesPage";
   ```

2. Trocar o uso na rota (linha 84):
   ```tsx
   <Route path="configuracoes" element={<ConfiguracoesPage />} />
   ```

3. Apagar o arquivo obsoleto `src/pages/Settings.tsx` para evitar confusão futura.

Sem outras alterações — `ConfiguracoesPage.tsx` já está pronto com o layout da Brazil Lands.
