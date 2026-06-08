## Problema

No funil de Oportunidades, o nome do cliente aparece como "—" mesmo quando a oportunidade tem cliente válido (visível ao editar).

**Causa:** Em `src/pages/imoveis/OportunidadesTab.tsx`, os mapas de `leads` e `contas` são carregados com uma única query (`supabase.from("contas").select("id,nome")`), que respeita o limite padrão de 1000 linhas do PostgREST. Quando há mais de 1000 contas/leads, vários clientes ficam de fora do mapa e o card mostra vazio. O `NovaOportunidadeDialog` já faz paginação por isso funciona lá.

## Correção

Em `src/pages/imoveis/OportunidadesTab.tsx`:

- Substituir as buscas únicas de `leads` e `contas` por uma busca paginada (loop com `.range(from, from+999)` até esgotar), igual ao padrão usado em `NovaOportunidadeDialog`.
- Manter o restante (profiles, vínculos, filtros) inalterado.

Sem mudanças de banco, sem mudanças de UI.