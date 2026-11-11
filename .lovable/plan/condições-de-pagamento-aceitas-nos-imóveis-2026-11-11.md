# Condições de pagamento aceitas nos imóveis

## O que muda para você
1. **No cadastro e na edição do imóvel**: nova seção "Condições de pagamento aceitas", com caixinhas para marcar uma ou mais opções:
   - À vista
   - Financiamento
   - Pagamento anual
   - Safra
   - Permuta (imóvel)
   - Veículos
2. **Na tela do imóvel (detalhes)**: as condições marcadas aparecem como selos.
3. **Na aba Imóveis**: novo filtro "Condição de pagamento". Ao escolher, por exemplo, "Safra" e "Veículos", a lista mostra só os imóveis que aceitam essas formas. Funciona em Disponíveis, Não publicados e Inativos, junto com os filtros que já existem.
4. Os imóveis que hoje têm a característica "Aceita permuta" marcada passam a aparecer automaticamente com "Permuta" na nova seção.

Nada aparece no site público por enquanto — é informação de uso interno.

## Detalhes técnicos
- Migração: coluna `imoveis.formas_pagamento text[] not null default '{}'` + índice GIN; backfill com `'permuta'` onde `caracteristicas` contém "Aceita permuta". View `imoveis_public` não é alterada.
- `NovoImovelDialog` / `EditarImovelDialog`: seção de checkboxes gravando o array.
- `DetalhesImovelDialog`: badges.
- `Imoveis.tsx`: filtro multisseleção (correspondência "aceita qualquer uma das marcadas", via `overlaps` no cliente).
- Regenerar types.
