## Filtros adicionais em Imóveis

Adicionar três novos filtros ao header da página `/crm/imoveis`, juntos aos filtros de Ano/Mês já existentes:

### 1. Corretor captador
- Select com lista de captadores (a partir de `imoveis.corretor_captador_id`, resolvidos via `profiles.nome`).
- Opção "Todos os captadores" como default.
- Mostra apenas captadores que aparecem em pelo menos um imóvel.

### 2. Faixa de valor
- Dois inputs numéricos compactos: **Min** e **Max** (R$).
- Filtra `imoveis.valor` entre os limites (qualquer um pode ficar vazio).
- Formatação leve com placeholder "R$ mín" / "R$ máx".

### 3. Bairro / Condomínio
- Input de texto único "Bairro ou condomínio".
- Match case-insensitive em `bairro`, `endereco` e `complemento` (já que não há campo `condominio` separado — condomínios normalmente aparecem ali).

### Comportamento
- Todos os filtros combinam (AND) com busca, ano e mês já existentes.
- Botão "Limpar" do header reseta todos os filtros (ano, mês, captador, faixa, bairro).
- Aplica nas abas Disponíveis, Em Proposta, Em Fechamento e Vendidos (lista local do `Imoveis.tsx`).

### Implementação
Em `src/pages/Imoveis.tsx`:
1. Novos estados: `captadorFiltro`, `valorMin`, `valorMax`, `bairroFiltro`.
2. `captadoresDisponiveis` via `useMemo` — ids únicos de `corretor_captador_id` com nome de `profiles`.
3. Novos predicados `matchesCaptador`, `matchesValor`, `matchesBairro` incluídos em `passa(i)`.
4. Header reorganizado: busca + linha de filtros (selects e inputs compactos). Em telas pequenas, empilham; em ≥ lg, ficam em flex-wrap.

Sem mudanças de schema.
