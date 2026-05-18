## Adicionar "Área construída" em Áreas e Cômodos

Hoje existem dois campos de área: **Área total** e **Área útil**. A solicitação é incluir também **Área construída**, mantendo "Área total" e adicionando o novo campo ao lado.

### Banco de dados
- Migração na tabela `imoveis`: adicionar coluna `area_construida numeric` (nullable).

### Cadastro/edição do imóvel
- **`NovoImovelDialog.tsx`** e **`EditarImovelDialog.tsx`**: na seção "Áreas e cômodos", incluir o input "Área construída (m²)" junto com "Área total" e "Área útil". Incluir no estado inicial, no carregamento do imóvel (edição) e no payload de insert/update.

### Listagem CRM
- **`Imoveis.tsx`**: quando houver `area_construida`, exibir junto das outras métricas de área no card.

### Site público
- **`ImoveisPage.tsx`** e **`ImovelDetalhePage.tsx`**: na exibição de área priorizar `area_util ?? area_construida ?? area_total`. Na página de detalhe, mostrar os três valores quando preenchidos.

### Fora de escopo
- Renomear/migrar dados das colunas existentes (`area_util`, `area_total`) — permanecem como estão.
- Filtro por área construída na busca pública.

Confirma para eu implementar?