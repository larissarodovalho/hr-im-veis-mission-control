# Corrigir tela branca ao abrir conta no CRM

## Diagnóstico (confirmado)

O `ErrorBoundary` que adicionamos capturou a mensagem exata:

> Failed to execute 'removeChild' on 'Node': O nó a ser removido não é filho deste nó.

Esse erro **não vem do nosso código**. É um bug conhecido do React quando o **Google Translate** (ou a tradução automática do Chrome/Edge/Safari) está ligado: o navegador troca os nós de texto em português por nós traduzidos, e quando o React tenta remover/atualizar esses nós, encontra elementos que já foram substituídos pelo tradutor e quebra a árvore — resultando em tela branca.

Isso explica perfeitamente o cenário:
- Acontece no site publicado (onde a tradução automática dispara com mais frequência)
- Acontece em todos os navegadores (todos baseados em Chromium têm a feature)
- Acontece em páginas com muito conteúdo dinâmico em português (lista de contas, detalhe da conta, timeline, agendamentos)
- Não acontece no preview do Lovable (domínio diferente, tradutor geralmente não ativa)

## Solução

Como o CRM é uma ferramenta interna em português, a tradução automática nunca deve agir sobre ele. Vamos instruir os navegadores a **não traduzir** a aplicação.

### 1. `index.html`
- Adicionar `<meta name="google" content="notranslate" />` no `<head>`
- Adicionar atributo `translate="no"` na tag `<html>`
- Adicionar classe `notranslate` no `<body>`

Isso desativa de forma definitiva o Google Translate, o tradutor do Chrome, do Edge e do Safari para toda a aplicação.

### 2. Manter o `ErrorBoundary`
Mantemos o ErrorBoundary que adicionamos — ele continua sendo a rede de segurança caso surja qualquer outro erro de render no futuro.

### Fora de escopo
- Nenhuma mudança em lógica de negócio, RLS, queries ou componentes do CRM
- Nenhuma mudança no site público (onde tradução pode ser desejável para visitantes estrangeiros)

## Como validar
Depois de publicar:
1. Abrir o CRM no navegador que estava quebrando
2. Clicar em qualquer contato — a página de detalhe deve carregar normalmente
3. Se o navegador oferecer "Traduzir esta página", a opção não deve mais aparecer dentro do CRM

Se mesmo assim houver tela branca, o ErrorBoundary vai mostrar a nova mensagem e conseguimos atacar a próxima causa.
