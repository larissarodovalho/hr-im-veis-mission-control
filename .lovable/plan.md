## Plano

1. **Gerar um novo Page Access Token**
   - No Graph API Explorer, use:
     ```text
     GET /1095453883642999?fields=id,name,access_token
     ```
   - Copie o valor de `access_token` retornado para a página **HR Imóveis**.

2. **Atualizar o token salvo no app**
   - Ir em `/crm/configuracoes`, na área de integração Meta/Facebook.
   - Substituir o token antigo pelo novo Page Access Token.
   - Salvar as configurações.

3. **Validar a conexão**
   - Testar novamente a integração/leitura de leads.
   - Confirmar que o erro de sessão expirada desapareceu.

4. **Se o erro continuar**
   - Verificar se o token gerado é de **Página**, não apenas de usuário.
   - Confirmar se ele foi emitido para a página `1095453883642999`.
   - Conferir se as permissões necessárias foram aceitas: `pages_show_list`, `leads_retrieval` e permissões relacionadas à página.

## Observação importante

Esse erro não é do app em si: ele vem da Meta dizendo que o token atual venceu. A correção é sempre gerar e salvar um token novo.