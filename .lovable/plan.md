# Performance: relatório individual por corretor em PDF + sincronização

## O que muda na tela (subaba Performance)
- Os filtros do topo do Funil de Contas (Carteira / Marketing / Todas + Corretor responsável) passam a valer para **toda a subaba**: funil, KPIs, gráficos e a tabela "Performance por corretor".
- A lista de corretores mostra só quem tem carteira (corretor, admin e gestor com contas — ex.: Hans), sem Marketing/Secretaria.
- Novo botão **"Gerar PDF do corretor"**, ativo quando um corretor está selecionado. Opção extra "PDF de todos (um por corretor)" gera um arquivo com uma seção por corretor.

## Conteúdo do PDF individual
- Cabeçalho HR Imóveis, nome do corretor, período e lista filtrada (Carteira/Marketing/Todas).
- KPIs: total de contas, em andamento, sem retorno, contato estabelecido, atendimento programado, tarefas atrasadas.
- Funil por etapa (quantidade e conversão para a próxima etapa).
- Oportunidades geradas, ganhas, perdidas e taxa de ganho.
- Leads recebidos (só aparece para quem tem acesso a Leads: Gabriel e Hans).
- Rodapé com data de geração e paginação, no mesmo padrão do PDF do Acompanhamento.

## Sincronização (problemas encontrados e correções)
1. **Tabela "Performance por corretor" ignora admin/gestor com carteira** (Hans some). Passar a incluir quem tem contas.
2. **"Contas criadas" e "Contatos estabelecidos" usam critérios diferentes do funil** (a tabela filtra por última alteração; o funil, por criação). Unificar no mesmo critério do funil para os números baterem.
3. **Tabela não respeita Carteira/Marketing** — passar a respeitar.
4. **Tarefas pendentes limitadas a 1.000 registros** — paginar para não perder contas quando a base crescer (hoje são 100).
5. **Atualização automática**: quando contas, tarefas, interações ou oportunidades mudarem, a subaba recarrega sozinha (sem precisar trocar de aba).
6. Conferência final comparando, para Hans, Gabriel, Rafael e Douglas: números da tela = PDF = dados da aba Contas/Oportunidades.

## Detalhes técnicos
- Elevar `lista` e `corretor` de `FunilContasReport` para `Reports.tsx` (props controladas) e reaproveitar em `load()`.
- `load()`: contas por `created_at` paginadas com `categoriaDe`; roles `corretor|admin|gestor` com pelo menos uma conta; oportunidades por `corretor_id`.
- Novo `src/lib/performancePdf.ts` (jsPDF, reaproveitando helpers de cabeçalho/rodapé de `acompanhamentoPdf.ts`) + teste em `src/test/`.
- Canal realtime único em `contas`, `tarefas`, `interacoes`, `oportunidades` com debounce de recarga.
- Sem mudanças no banco.
