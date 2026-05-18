## Problema

A aba "Visitas" (`src/pages/Visits.tsx`) grava na tabela `visitas` (que já tem `imovel_id`), mas o drawer `ImovelHistoricoDrawer` só lê da tabela `reunioes`. Por isso a visita criada lá não aparece no histórico.

## Correção

Em `src/components/imoveis/ImovelHistoricoDrawer.tsx`:

1. Adicionar à query paralela uma busca em `visitas` filtrando por `imovel_id`:
   ```ts
   supabase.from("visitas").select("*").eq("imovel_id", imovel.id)
   ```
2. Coletar `lead_id`s também das visitas para o `leadsMap`.
3. Fazer push no `merged` com `kind: "visita"`, usando `data_visita` como `date`, `status` e `observacoes` como subtitle.
4. Manter a leitura atual de `reunioes` (visitas agendadas via Meetings/Schedule continuam aparecendo).
5. Deduplicar nada — são tabelas distintas.

Sem mudanças de schema, sem mudanças em outras telas.
