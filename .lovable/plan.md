# Unificar cards do topo com imóveis do portfólio

Em `src/pages/AccountDetail.tsx`, atualizar os dois cards de resumo no topo da ficha:

- **Propriedades** → contar `imoveisPortfolio.length + props.length`. Adicionar abaixo uma linha pequena: "X no portfólio · Y cadastradas".
- **Valor total dos negócios** → somar `valor` dos imóveis do portfólio + `valor_negocio` das propriedades manuais. Manter a linha de "Comissões" (continua vindo só das propriedades manuais).

Sem mudanças de banco, nem em outras seções da página.