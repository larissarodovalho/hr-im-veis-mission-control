## Ajustes no Novo compromisso: tipo "Mensagem" e vínculo com Conta

### 1. Adicionar tipo "Mensagem"

Hoje o `Compromisso.tipo` aceita `ligacao | presencial | videochamada`. Vou adicionar `mensagem` (ex.: WhatsApp/SMS) como mais uma opção.

Mudanças em `src/pages/Schedule.tsx`:
- Tipo `Compromisso["tipo"]` ganha `"mensagem"`.
- `TIPO_LABEL` ganha `mensagem: "Mensagem"`.
- `TipoIcon` retorna `MessageCircle` (lucide) para mensagem.
- Select do "Novo compromisso" ganha `<SelectItem value="mensagem">💬 Mensagem</SelectItem>`.
- `tipoChip` (mapa de cores no grid) ganha entrada para `mensagem`.
- Persistência: a coluna `reunioes.tipo` é text livre, então não precisa de migração.

### 2. Vínculo com Conta no formulário

Hoje o diálogo só permite vincular Lead e Imóvel. Vou adicionar um Select "Conta vinculada" (clientes do funil), salvando em `reunioes.conta_id` (coluna já existe e já é lida no loader).

Mudanças em `src/pages/Schedule.tsx`:
- Novo estado `contasList` carregado no `load()` via `supabase.from("contas").select("id, nome").order("nome")`.
- `novo` ganha `conta_id: "none"`.
- Novo `<Select>` "Conta vinculada" abaixo do "Lead vinculado", com `SearchableSelect` se a lista crescer — manter `Select` padrão por consistência com o resto do diálogo.
- `criarCompromisso` envia `conta_id: novo.conta_id === "none" ? null : novo.conta_id` em cada linha (inclusive nas ocorrências recorrentes).
- Reset do `setNovo` inclui `conta_id: "none"`.

Sem alteração de banco — `reunioes.conta_id` já existe e o card do dia já mostra "Cliente:" quando `conta_nome` está presente.

### Arquivos
- `src/pages/Schedule.tsx` — tipo, label, ícone, chip de cor, carga de contas, novo campo no diálogo e na inserção.
