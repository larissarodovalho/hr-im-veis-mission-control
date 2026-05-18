## Subabas em Imóveis: Disponíveis / Em Proposta / Vendidos

Adicionar navegação por abas na página `/crm/imoveis` cruzando os dados de **imóveis**, **propostas** e **leads/contatos** que já existem no banco.

### Estrutura das abas

```text
[ Disponíveis ]  [ Em Proposta ]  [ Vendidos ]
```

1. **Disponíveis** — comportamento atual: lista todos os imóveis (grid de cards), com busca e cadastro.
2. **Em Proposta** — imóveis que possuem ao menos uma proposta com status `Em análise` ou `Aceita` e que ainda não estão vendidos. Cada card mostra:
   - Imóvel (foto, título, código, cidade)
   - Lead/Contato vinculado (nome + telefone) vindo de `propostas.lead_id → leads`
   - Corretor responsável
   - Valor da proposta e status (`Em análise`, `Aceita`, `Recusada`)
   - Botões: **Marcar como vendido** e **Ver proposta** (abre detalhe)
3. **Vendidos** — imóveis com `status = 'Vendido'`. Cards mostram:
   - Imóvel + cidade
   - Comprador (lead/contato da proposta aceita)
   - Corretor
   - Valor de venda (proposta aceita) e data de fechamento

### Ação "Marcar como vendido"
Na aba **Em Proposta**, ao clicar em "Marcar como vendido" numa proposta:
- `propostas.status = 'Aceita'`
- `imoveis.status = 'Vendido'`
- Demais propostas do mesmo imóvel passam a `Recusada`
- Registra entrada em `activity_log` ("Imóvel X vendido para Y")

### Vínculo de dados
O elo já existe via `propostas (lead_id, imovel_id, corretor_id, valor, status)`. Nenhuma mudança de schema é necessária — apenas usaremos o status `Vendido` em `imoveis.status` (já permitido, é coluna text livre) e o status `Aceita` em `propostas.status`.

### Detalhes técnicos
- `src/pages/Imoveis.tsx`: envolver o conteúdo em `<Tabs>` do shadcn; carregar `propostas` + `leads` no mount; derivar três listas em memória (disponíveis, emProposta, vendidos).
- A busca passa a filtrar a aba ativa.
- Reaproveitar o card existente como `ImovelCard` e criar variações leves para Proposta/Vendido (mesmas dimensões).
- Sem migrations, sem mudanças de RLS.

### Fora do escopo
- Edição de proposta (já existe em outra área).
- Relatórios/dashboard de vendas (continua no Dashboard).