# Plano: Filtro de leads por período de entrada (7 / 15 / 30 dias)

## Objetivo
Adicionar na aba **Leads** um filtro de período que mostra apenas os leads que entraram nos últimos 7, 15 ou 30 dias, para monitorar a ordem cronológica. Hoje não existe nenhum filtro de data na tela.

## Escopo
- Arquivo único: `src/pages/Leads.tsx`
- Sem mudanças de backend/banco — todos os leads já são carregados; o filtro é só client-side.

## Mudanças

### 1. Novo estado de período
Adicionar `const [periodo, setPeriodo] = useState<"todos" | "7" | "15" | "30">("todos")` junto aos outros estados de filtro (linha ~50).

### 2. Seletor no cabeçalho
Inserir um `<Select>` entre a busca e o `<Tabs>` de visualização (linhas 188–198), com as opções:
- Todos os períodos
- Últimos 7 dias
- Últimos 15 dias
- Últimos 30 dias

Usar o mesmo estilo compacto do seletor de ordenação já existente (`w-40 h-9 text-sm`). Ícone `CalendarClock` (já importado) à esquerda opcional.

### 3. Aplicar o filtro na lista `filtered`
No bloco de filtro (linhas 128–141), antes de `return true`, adicionar:

```ts
if (periodo !== "todos") {
  const base = l.data_entrada ?? l.created_at;
  if (!base) return false;
  const dias = Math.floor((Date.now() - new Date(base).getTime()) / 86400000);
  const limite = Number(periodo);
  if (dias > limite) return false;
}
```

Usa `data_entrada` (data oficial de chegada do lead), com fallback em `created_at`, ambos já disponíveis no tipo `Lead`. A janela é inclusiva (≤ limite).

### 4. Aplicar também no painel Atendimento
O `AtendimentoPanel` recebe `search` por props e tem seu próprio filtro (linha 412+). Passar `periodo` como prop adicional e replicar a mesma condição de data no filtro interno, para que o monitoramento de atendimento também respeite o período selecionado.

### 5. Contador no header
O texto `{filtered.length} de {leads.length}` (linha 173) já reflete o filtro automaticamente.

## Não incluído
- Persistência do filtro na URL (os outros filtros da tela também não persistem).
- Agrupamento por dia — o usuário pediu apenas filtrar por janela e a ordenação já é cronológica (`created_at` desc).

## Verificação
- Trocar o seletor entre 7/15/30/Todos e conferir que o contador e as colunas/lista mudam.
- Conferir que leads mais antigos somem ao selecionar 7 dias e reapareçam em "Todos".
- Validar que o painel Atendimento também respeita o período.
