# Mostrar o proprietário no cartão do imóvel

## Causa
A tela de Imóveis carrega os nomes das contas de uma vez só, e o sistema devolve no máximo 1.000 por consulta. Hoje existem 1.557 contas. O proprietário do HR-0002 (R. GRANDO ENGENHARIA E TERRAPLENAGEM LTDA) é uma das contas mais recentes, então o nome dele fica de fora e o cartão mostra "—". A janela de edição busca o proprietário direto, por isso lá ele aparece.

## Correção
- Em `src/pages/Imoveis.tsx`, buscar somente as contas que são proprietárias de algum imóvel carregado (`.in("id", ids)`, dividido em lotes) em vez de buscar a lista inteira.
- Assim o nome aparece em todos os cartões (Disponíveis, Não publicados, Inativos etc.) e na janela de detalhes, mesmo quando houver muito mais contas.
- Nada muda no cadastro nem nos dados.

## Verificação
Abrir a aba Inativos no preview e conferir que o HR-0002 mostra "Proprietário: R. GRANDO ENGENHARIA E TERRAPLENAGEM LTDA".
