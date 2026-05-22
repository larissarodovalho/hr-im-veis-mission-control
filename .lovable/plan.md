## Comissionamento HR Imóveis — matriz oficial

A comissão total é sempre **5% do VGV**, dividida entre **Captador / Vendedor / HR Imóveis** conforme **Origem do Negócio × Nível** do corretor. O caso mais comum (Base do Corretor + Sênior) corresponde ao split mencionado: **20% / 40% / 40%** dos 5%.

### Matriz aplicada (em % do VGV)

| Origem | Nível | Captador | Vendedor | HR | Total |
|---|---|---|---|---|---|
| Base do Corretor (Orgânico) | Júnior | 0,5% | 1,0% | 3,5% | 5% |
| Base do Corretor (Orgânico) | **Sênior** | **1,0%** | **2,0%** | **2,0%** | **5%** |
| Base Institucional (CRM Interno) | Júnior | 0,5% | 0,5% | 4,0% | 5% |
| Base Institucional (CRM Interno) | Sênior | 0,5% | 2,0% | 2,5% | 5% |
| Base HRX (Tráfego/Marketing) | Júnior | 0,5% | 0,5% | 4,0% | 5% |
| Base HRX (Tráfego/Marketing) | Sênior | 0,5% | 1,5% | 3,0% | 5% |

Default ao criar uma venda: **Base do Corretor + Sênior** (=20%/40%/40% dos 5%).

### 1. Schema

**`profiles`** — adicionar `nivel text default 'senior'` (`'junior' | 'senior'`).

**`vendas`** — adicionar
- `origem_negocio text` (`'base_corretor' | 'base_institucional' | 'base_hrx'`)
- `nivel_corretor text` (`'junior' | 'senior'`, snapshot da venda)

Reaproveitar `percent_vendedor` / `percent_captador` / `percent_hr` (já existem) — passam a representar **% do VGV** (não mais % da comissão). `valor_comissao` = `valor_venda × soma_pcts / 100` (≈ 5%).

Tabela de referência em `src/lib/comissaoHR.ts` com a matriz e `getSplit(origem, nivel)`.

### 2. UI — `NovaVendaDialog` / `EditarVendaDialog`

- Novos selects **Origem do Negócio** e **Nível** (Júnior/Sênior).
- Nível pré-preenche com o `nivel` do corretor vendedor selecionado (editável na venda).
- Bloco "Divisão da comissão (% do VGV)" auto-preenche pela matriz ao mudar origem/nível; permanece editável (sugestão editável).
- `Comissão R$` recalcula automaticamente a partir do VGV × soma dos %.
- Indicador "fora da tabela" quando o usuário sobrescrever os valores.

### 3. UI — `FaturamentoReport`

- Filtros novos: **Origem do Negócio** e **Nível** (combinam com os atuais Período/Papel/Corretor).
- Cálculos já ficam corretos: `R$_papel = valor_venda × percent_papel / 100`.
- Ranking ganha breakdown opcional por origem.

### 4. Nível por corretor

Em `src/pages/UsuariosAdminPage.tsx`: select **Nível** (Júnior/Sênior) por linha, persistindo em `profiles.nivel`. Só admin/gestor edita.

### 5. Sem mudanças

- RLS, outras telas e relatórios permanecem.
- Vendas antigas (sem origem/nível) mantêm os percentuais salvos, sem recálculo retroativo.

### Fora de escopo

- Folha de pagamento / fechamento contábil.
- Inferência automática da origem a partir de tags do lead — origem é sempre selecionada manualmente no momento da venda (auditável).