# Imóveis vendidos dentro da aba "Inativos"

## Objetivo
Os imóveis vendidos passam a aparecer também na aba **Inativos**, marcados com a tag **"Vendido"**, e o clique no código do imóvel na aba **Vendidos** leva direto para a aba Inativos (em vez de abrir a janela de detalhes).

## Mudanças

### 1. Aba "Inativos" inclui os vendidos — `src/pages/Imoveis.tsx`
- A lista `inativos` passa a incluir também os imóveis com `stage(i) === "vendido"`.
- Em `renderForaDePublicacao`, quando o imóvel for vendido, o selo mostra **"Vendido"** (em vez do status), e a dica de reativação não aparece para vendidos.
- O contador da aba Inativos e o resumo do topo passam a contar inativos + vendidos.

### 2. Clique no código navega para a aba Inativos — `src/pages/imoveis/VendidosTab.tsx`
- O botão do código (ex.: HR-0002) deixa de abrir a janela de detalhes e passa a navegar para `/crm/imoveis?tab=inativos`, onde o imóvel estará listado com a tag "Vendido".

## O que não muda
- A aba **Vendidos** continua igual (tabela de vendas, valores, comissão, contrato).
- O status do imóvel no banco não muda — continua "Vendido"; é só a exibição na aba Inativos.
- As demais abas (Disponíveis, Não publicados, Em Proposta, Em Fechamento) não mudam.

## Verificação
- Typecheck, testes e build.
- Preview: aba Inativos mostra o lote HR-0002 com tag "Vendido"; clicar no código na aba Vendidos abre a aba Inativos.
