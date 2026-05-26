## Problema

O item "Minha conta" já existe no sidebar (grupo "Pessoal", no rodapé), mas passa despercebido. Você esperava encontrá-lo dentro da página `/crm/configuracoes`.

## Mudanças

### 1. Página de Configurações (`src/pages/ConfiguracoesPage.tsx`)
- Adicionar nova aba **"Minha conta"** (ícone `UserCircle`) ao lado das abas Empresa / Site / Notificações / Sistema.
- O conteúdo da aba reusa o componente `GoogleCalendarConnect` (e mostra também o e-mail do usuário logado e link para a página completa `/crm/minha-conta`).

### 2. Sidebar (`src/components/AppSidebar.tsx`)
- Mover o item **"Minha conta"** para logo abaixo do bloco de navegação principal (antes de "Administração"), para ganhar destaque visual.
- Adicionar um pequeno indicador (ponto/badge) quando o Google Calendar ainda **não** estiver conectado, lendo de `user_google_calendar` via um hook leve.

### 3. Sem mudanças de lógica/back-end
Nenhuma alteração em edge functions, migrations ou tabelas — apenas UI/navegação.

## Fora de escopo
- Renomear ou remover o item existente do sidebar (continua acessível por `/crm/minha-conta`).
- Mudar permissões: a aba "Minha conta" em Configurações fica visível a qualquer usuário staff que já acessa Configurações.
