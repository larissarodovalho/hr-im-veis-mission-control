# Desativar usuários sem apagar dados

## Objetivo
Permitir que você desative um corretor na aba **Usuários**, bloqueando seu acesso e preservando seu cadastro e todos os dados vinculados.

## Situação verificada
- O cadastro já tem o campo `ativo`, mas a página Usuários não oferece uma ação de desativação.
- A ação **Remover** atual exclui o usuário; ela não será usada para desativá-lo.
- A proteção de entrada no CRM hoje verifica o login, sem verificar o campo `ativo`.

## Alterações propostas
1. **Desativar e reativar:** acrescentar uma ação própria na lista de usuários, disponível apenas para administradores, com confirmação mostrando o nome do corretor. Impedir que o administrador desative a si mesmo.
2. **Status visível:** mostrar **Ativo** ou **Desativado** no computador e no celular. O usuário desativado continua na lista e pode ser reativado posteriormente.
3. **Bloqueio efetivo de acesso:** impedir novos logins e a renovação do acesso; se o usuário já estiver com o CRM aberto, encerrar seu acesso. Proteger também as consultas e ações diretas para que uma sessão antiga não permita continuar usando o sistema.
4. **Preservar tudo:** manter nome, e-mail, cargo, permissões, clientes, oportunidades, imóveis, tarefas, vendas, comissões e histórico. Não excluir registros, transferir clientes automaticamente nem retirar o corretor dos relatórios históricos.
5. **Conferência:** testar desativação, tentativa de acesso com sessão anterior, impedimento de reativação pelo próprio usuário e reativação por administrador; confirmar que os registros vinculados continuam iguais.

## Detalhes técnicos
- Reutilizar `profiles.ativo`, sem criar outro cadastro de usuário.
- Acrescentar ações de desativar/reativar à função administrativa existente, validando no servidor o papel de administrador e seu estado ativo.
- Aplicar o bloqueio reversível pela API administrativa de autenticação, sem editar tabelas gerenciadas de autenticação. Coordenar esse bloqueio com o status do cadastro e tratar falhas sem apresentar sucesso parcial.
- Verificar o estado ativo em `AuthContext`/`ProtectedRoute` e nas autorizações do servidor. Cobrir políticas baseadas apenas em `auth.uid()` e funções privilegiadas, sem alterar permissões de usuários ativos ou o acesso público ao site.
- Restringir a alteração de `ativo` a administradores, preservando a edição dos demais dados pessoais pelo próprio usuário.
- Incluir testes das regras de acesso e preservação de dados junto aos testes existentes.

## Limite desta alteração
Será criada a opção de desativar; nenhum corretor será desativado automaticamente. Você escolherá o usuário e confirmará a ação na aba Usuários.