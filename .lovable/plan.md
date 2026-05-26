# Sincronizar imóveis do portfólio na ficha da conta

Hoje, quando um imóvel é cadastrado com um proprietário (conta), essa relação fica salva em `imoveis.proprietario_id`, mas a ficha da conta (em **CRM › Contas › [cliente]**) só mostra a seção "Propriedades / Negócios" que é preenchida manualmente (`conta_propriedades`). O imóvel cadastrado no portfólio não aparece automaticamente lá.

## Mudança

Em `src/pages/AccountDetail.tsx`, adicionar uma nova seção **"Imóveis no portfólio"** logo acima de "Propriedades / Negócios":

- Buscar no `load()`: `supabase.from("imoveis").select("id, codigo, titulo, tipo, finalidade, status, valor, cidade, estado, fotos, publicado").eq("proprietario_id", id).order("created_at", { ascending: false })`
- Renderizar lista de cards compactos com foto (thumb), código, título, cidade, badge de status (Disponível / Vendido / etc.), badge "Publicado" ou "Não publicado", finalidade · tipo e valor formatado.
- Cada card é um link para `/crm/imoveis` (e abre o histórico/edição daquele imóvel ao clicar — por ora, link simples para a aba de imóveis, já que não há rota individual).
- Estado vazio: card cinza "Nenhum imóvel deste cliente no portfólio. Cadastre em Imóveis selecionando este cliente como proprietário."
- Também incluir no contador do card "Propriedades" no topo: somar `imoveisDoCliente.length + conta_propriedades.length` (ou separar em dois cards: "Imóveis no portfólio" e "Propriedades cadastradas").

## Fora de escopo

- Não criar rota individual de imóvel.
- Não alterar `conta_propriedades` nem o cadastro de imóveis — só leitura cruzada.
- Sem mudanças no banco (a coluna `proprietario_id` já existe).
