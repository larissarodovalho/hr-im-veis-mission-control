# Auditoria completa de sincronização da aba Relatórios

## Objetivo
Conferir, subaba por subaba, se cada número de Relatórios bate com os dados reais das abas de origem (Leads, Contas, Oportunidades, Propostas, Visitas, Vendas, Carteira, Imóveis, Links) e se atualiza sozinho quando algo muda no sistema.

## Etapa 1 — Conferência (somente leitura, nada é alterado)
Para cada subaba, no período atual (2026) e em um mês de teste:

| Subaba | Comparar com |
|---|---|
| Performance | Contas, Oportunidades, Tarefas e Leads por corretor (e o PDF individual) |
| Acompanhamento | Interações e tarefas das contas; totais por corretor tela = PDF = CSV |
| Leads | Aba Leads: entradas por etapa, origem e conversões em Conta |
| Oportunidades | Aba Oportunidades: por estágio, corretor, ganhas/perdidas |
| Negócios fechados | Vendas e fechamentos das contas |
| Propostas | Propostas de Contas e de Oportunidades (sem duplicar as espelhadas) |
| Carteira | Lotes, atribuições, devoluções, lotes cancelados |
| Imóveis | Cadastro de imóveis, captações, vendidos |
| Links dos imóveis | Links criados, abertos, expirados |
| Faturamento | Vendas e comissões |

Em cada uma, verificar:
- mesmo critério de data (criação x encerramento x atualização) e fuso de Cuiabá;
- limite de 1.000 registros (números cortados);
- corretores certos (sem Marketing/Secretaria como corretor; Hans incluído);
- filtro de período aplicado de fato;
- atualização automática ao mudar dados (hoje só a Performance faz isso).

## Etapa 2 — Relatório para você
Uma tabela "está batendo / não está batendo" por subaba, com o número da tela, o número real e a causa de cada diferença. Você aprova o que corrigir.

## Etapa 3 — Correções aprovadas
- Corrigir critérios e cortes de 1.000 registros encontrados.
- Adicionar atualização automática nas subabas que não têm.
- Conferência final com Playwright: tela = PDF/CSV = dados de origem para Hans, Gabriel, Rafael e Douglas.

## Detalhes técnicos
- Leitura de cada `src/components/reports/*Report.tsx`, levantamento das consultas e comparação via SQL somente leitura.
- Regras mantidas: sem reatribuir responsáveis, sem migrar etapas antigas, Leads só admin/gestor/marketing, Oportunidade mantém seu corretor.
- Realtime com canal único por subaba e recarga com atraso curto, como na Performance.
