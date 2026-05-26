# Toggle Publicado / Não publicado nos cards de imóveis

Hoje todo imóvel com `status = 'Disponível'` aparece automaticamente no site público (a view `imoveis_public` filtra só por status). Não há jeito de manter um imóvel no CRM sem expor no site.

## Mudanças

### Banco
- Adicionar coluna `publicado boolean NOT NULL DEFAULT true` em `public.imoveis` (default `true` preserva o comportamento atual de todos os imóveis existentes).
- Recriar a view `public.imoveis_public` adicionando `AND publicado = true` na cláusula `WHERE`.

### Frontend (`src/pages/Imoveis.tsx`)
- No "bannerzinho" (canto superior da foto) de cada card, ao lado do badge de status, adicionar um segundo badge clicável:
  - **Publicado** — verde, ícone `Eye`
  - **Não publicado** — cinza, ícone `EyeOff`
- Clique alterna o campo `publicado` no banco via `supabase.from('imoveis').update({ publicado: !i.publicado })` e atualiza o estado local otimista. Toast de confirmação.
- Aplicar no card de "Disponível" e também no de "Em proposta" (mesmo padrão visual).

### Fora de escopo
- Não mexer em outras abas (Captação, Parceiros, Vendidos), nem em filtros, nem no formulário de novo/editar imóvel — só o toggle no card.
