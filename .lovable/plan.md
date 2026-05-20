## Diagnóstico até aqui

- Reproduzi o fluxo no preview clicando em uma conta (`/crm/contas/:id`) e a página **carregou normalmente**, sem erros no console.
- Não há service worker no projeto (nada para "ficar preso" em cache antigo automaticamente).
- A página `AccountDetail.tsx` só retorna "Carregando…" enquanto não tem dados. Para a tela ficar **100% em branco**, algum componente filho precisa estar **lançando exceção no render** — e como não existe `ErrorBoundary` envolvendo as rotas do CRM, qualquer crash desmonta a árvore inteira e deixa só o fundo branco.
- Recentemente foram adicionados os campos `temperatura` e a opção `"Não definido"` em `interesse`. Os componentes que renderizam dados da conta (`ContaInteracoesTimeline`, `ContaAgendamentosList`, `ContaTarefas`, `ContaAgendaQuickAdd`, `EntityDocumentsTab`) precisam ser revisados para garantir que não quebrem com valores `null`/novos.
- O sintoma "todas as contas, em qualquer navegador, só no CRM publicado" combina com bundle publicado mais antigo do que o schema atual (ou um crash determinístico que só dispara em produção).

## Plano

1. **Adicionar um ErrorBoundary global do CRM** envolvendo `<AppLayout />` em `src/App.tsx`. Em vez de tela branca, o usuário verá uma mensagem ("Algo deu errado nesta página") com botão "Tentar novamente" e o stack do erro logado no console — assim já evitamos para sempre o sintoma de tela branca silenciosa.

2. **Endurecer `src/pages/AccountDetail.tsx`**:
   - Capturar erros do `load()` em `try/catch`, mostrar um estado "Não foi possível carregar esta conta" com botão de tentar novamente, e logar o erro real.
   - Garantir que campos opcionais (`tags`, `temperatura`, `interesse`, `responsavel_id`) sejam tratados defensivamente em todos os ramos.

3. **Revisar os componentes filhos** (`ContaInteracoesTimeline`, `ContaAgendamentosList`, `ContaTarefas`, `ContaAgendaQuickAdd`, `EntityDocumentsTab`) só para confirmar que nenhum acessa campo em objeto possivelmente `null` sem checagem. Corrigir o que aparecer.

4. **Republicar o app** para que o bundle do CRM (`hrimoveis.com` / `royal-dashboard.lovable.app`) passe a incluir o ErrorBoundary e o tratamento de erro. Isso já elimina o sintoma "100% em branco" — se ainda houver erro, ele aparecerá em texto e poderemos diagnosticar com precisão.

## Detalhes técnicos

- `ErrorBoundary` será um componente class simples em `src/components/ErrorBoundary.tsx` com `getDerivedStateFromError` + `componentDidCatch` (chama `console.error`), e fallback usando `Card`/`Button` do design system (sem cores hardcoded).
- Aplicado em `src/App.tsx` envolvendo o `<AppLayout />` da rota `/crm`.
- `AccountDetail.load()` passa a setar um estado `loadError` em caso de exceção (timeout, RLS, etc.), com renderização condicional antes do `if (!acc)`.

## O que NÃO está no escopo

- Não vou mexer em lógica de negócios das contas, RLS, ou em outros componentes do CRM além do que for necessário para evitar/diagnosticar a tela branca.
- Não vou alterar o site público (`/`, `/imoveis`, etc.).

Depois que aprovar, implemento e te aviso para republicar e validar.
