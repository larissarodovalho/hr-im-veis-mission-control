# Documentação completa da aba "Imóveis"

Criar `docs/FLUXO-IMOVEIS.md`: um documento técnico-funcional que descreve todo o fluxo da aba Imóveis, com detalhe suficiente para replicar o módulo em outro CRM. Nenhuma mudança de comportamento no sistema — apenas documentação.

## O que o documento vai conter

1. **Visão geral do módulo**
   - Rota `/crm/imoveis`, permissões de acesso e papéis envolvidos.
   - As 7 abas internas: Disponíveis, Em Proposta, Em Fechamento, Vendidos, Oportunidades de Negócio, Captação, Parceiros — e o que define a entrada de um imóvel em cada uma.

2. **Fluxo do imóvel, ponta a ponta**
   - Captação → Cadastro → Publicação no site → Proposta → Fechamento/Venda → Vendidos.
   - Regras de mudança de status e de derivação de etapa (status do imóvel + propostas vinculadas).
   - Exclusividade, captador, corretor responsável, parceiro e proprietário.

3. **Cadastro do imóvel (campos e regras)**
   - Lista completa dos campos do formulário: identificação, tipo, finalidade, status, valores, áreas, cômodos, endereço, características, destaque/publicado, matrícula.
   - Campos condicionais por tipo (terreno/rural x comercial x residencial).
   - Vínculos: responsável, captador, parceiro, proprietário.
   - Fotos: upload, limite, original privado + versão pública com marca d'água.

4. **Filtros e listagem**
   - Busca, ano, mês, captador, faixa de valor, bairro; contadores por aba.

5. **Telas e componentes auxiliares**
   - Detalhes do imóvel, edição, documentos, histórico, nova proposta, nova venda, cadastro de corretor parceiro, funil de captação, parceiros, vendidos.

6. **Banco de dados**
   - Tabelas: `imoveis`, `imovel_documentos`, `captacoes_imovel`, `corretores_parceiros`, `propostas`, `vendas`, `oportunidade_imoveis`, `meta_ads_imoveis`.
   - Campos principais de cada uma, relacionamentos e como o módulo as consulta.
   - Funções/triggers relevantes (ex.: geração de código do imóvel, sincronizações de captação e proposta).
   - Resumo das regras de acesso (quem lê/edita o quê) e dos buckets de storage usados para fotos e documentos.

7. **Integração com o site público**
   - Como `publicado` e `destaque` alimentam as páginas de imóveis e a home, e o papel das configurações de site.

8. **Guia de replicação**
   - Ordem sugerida de implementação em outro CRM: tabelas e permissões → storage e marca d'água → cadastro → listagem/filtros → propostas e vendas → captação e parceiros → site público.

## Detalhes técnicos

- Arquivo único em markdown, em português, com tabelas de campos e diagramas em blocos ```text.
- Fontes da documentação (somente leitura): `src/pages/Imoveis.tsx`, `src/pages/imoveis/{CaptacaoTab,ParceirosTab,VendidosTab}.tsx`, `src/components/imoveis/*`, `src/lib/{captacaoFunil,uploadFotoImovel,watermark,exclusividade,comissaoHR}.ts`, além do schema das tabelas citadas.
- Sem PDF nesta entrega (pode ser gerado depois, se quiser).
