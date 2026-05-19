## Adicionar Temperatura do contato (Quente / Morno / Frio) nas Contas

Novo campo qualitativo para classificar o "calor" do lead/cliente, visível na conta, no Kanban e nos cards da listagem.

### Banco

- Migration: `ALTER TABLE public.contas ADD COLUMN IF NOT EXISTS temperatura text;`
- Sem CHECK constraint (mantém padrão do projeto — valores livres validados na UI). Valores aceitos pela UI: `quente`, `morno`, `frio`, ou vazio.
- Index leve por temperatura: `CREATE INDEX IF NOT EXISTS idx_contas_temperatura ON public.contas(temperatura);`

### Frontend — escopo

1. **`src/lib/contasTemperatura.ts`** (novo) — helper único com labels, ícones e cores:
   - `quente` → 🔥 vermelho/laranja
   - `morno` → 🌤️ âmbar
   - `frio` → ❄️ azul

2. **`src/components/contas/NovaContaDialog.tsx`** — `Select` "Temperatura" (com opção "Não definida") ao lado do Tipo PF/PJ.

3. **`src/pages/AccountDetail.tsx`**
   - Badge no cabeçalho (junto com Interesse e Ramo).
   - `Select` no diálogo "Editar conta" e incluir `temperatura` no `update`.

4. **`src/pages/Accounts.tsx`**
   - Adicionar `temperatura` no `select(...)`.
   - Badge nos cards (tabela e grid).
   - Filtro topo: "Temperatura: todas / quente / morno / frio".

5. **`src/components/contas/ContasKanban.tsx`** — pequeno badge de temperatura no card (ao lado de Interesse/Responsável).

### Fora de escopo

- Não vou criar coluna no Kanban por temperatura (etapa de funil é outro eixo).
- Sem regra automática de definir temperatura — é manual.

### Confirmações

- Manter exatamente 3 níveis (Quente / Morno / Frio) + "Não definida"? Ou quer um quarto tipo (ex.: "Gelado" para descartado)?
