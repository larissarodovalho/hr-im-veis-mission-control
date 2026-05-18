## Funil completo do imóvel: Disponível → Em Proposta → Em Fechamento → Vendido

Hoje o botão "Marcar como vendido" só aparece se já existir uma proposta no banco — mas **não existe nenhuma tela para criar a proposta**. Por isso parece que falta o passo a passo. Vamos resolver criando o fluxo inteiro dentro da aba **Imóveis**, com ações claras em cada estágio.

### Novas abas (4 estágios)

```text
[ Disponíveis ]  [ Em Proposta ]  [ Em Fechamento ]  [ Vendidos ]
```

| Estágio | Condição no banco | Como o imóvel entra aqui |
|---|---|---|
| **Disponível** | `imoveis.status = 'Disponível'` e sem proposta em aberto | Cadastro normal do imóvel |
| **Em Proposta** | existe `propostas` com status `Em análise` para este imóvel | Botão **"Iniciar proposta"** no card do imóvel disponível |
| **Em Fechamento** | proposta `Aceita`, imóvel ainda não `Vendido` | Botão **"Aceitar proposta"** dentro da aba Em Proposta |
| **Vendido** | `imoveis.status = 'Vendido'` | Botão **"Confirmar venda"** dentro da aba Em Fechamento |

### Passo a passo do corretor

1. **Cadastrar imóvel** → aparece em *Disponíveis*.
2. Quando um lead/contato faz uma oferta, no card do imóvel clica em **"Iniciar proposta"**:
   - Abre diálogo escolhendo **Lead** (busca em `leads`), **Valor proposto**, **Condições**, **Observações**.
   - Cria registro em `propostas` (status `Em análise`) vinculando `imovel_id`, `lead_id`, `corretor_id`, `valor`.
   - Imóvel passa para a aba **Em Proposta**.
3. Na aba **Em Proposta**, o card mostra lead + valor. Ações:
   - **Aceitar proposta** → `propostas.status = 'Aceita'`, demais propostas do imóvel viram `Recusada`. Imóvel vai para **Em Fechamento**.
   - **Recusar** → `propostas.status = 'Recusada'`. Se não sobrar nenhuma em análise, volta para *Disponíveis*.
   - **Nova proposta** (outro lead, mesma negociação concorrente).
4. Na aba **Em Fechamento**, card mostra comprador + valor acordado + atalho para **gerar contrato** (já existe `contratos` no sistema). Ações:
   - **Confirmar venda** → `imoveis.status = 'Vendido'`, registra `activity_log` (`tipo='venda'`), imóvel vai para **Vendidos**.
   - **Cancelar fechamento** → volta a proposta para `Em análise`.
5. **Vendidos** mostra histórico com comprador, valor final, corretor e data.

### Vínculo (contato + imóvel + proposta + venda)

Tudo já apoiado na tabela `propostas (lead_id, imovel_id, corretor_id, valor, status)`. Nenhuma mudança de schema — só usamos os valores `Em análise`, `Aceita`, `Recusada` em `propostas.status` e `Disponível` / `Vendido` em `imoveis.status`.

### Arquivos a tocar

- `src/pages/Imoveis.tsx` — passar de 3 para 4 abas; derivar lista "Em Fechamento"; adicionar botões de ação por estágio.
- `src/components/imoveis/NovaPropostaDialog.tsx` *(novo)* — formulário com seleção de lead (Combobox buscando em `leads`), valor, condições, observações; faz `insert` em `propostas`.
- Reaproveitar o card existente, adicionando um rodapé de ações específico por estágio.

### Fora do escopo
- Geração de contrato propriamente dita (continua em /contratos, apenas linkamos).
- Pipeline/Kanban arrastável — manteremos abas + botões explícitos.