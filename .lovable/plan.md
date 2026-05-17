Vou corrigir o problema do link de agendamento da Sofia e deixar a página mais resistente a falhas.

O que encontrei:
- O link mais recente existe no banco e a função de disponibilidade responde corretamente.
- Ao abrir o link real mais recente, a página carrega com horários normalmente.
- O caso que aparece como “Link inválido” acontece quando o token da URL não existe, expira, é cortado/copied incorretamente, ou quando a função retorna erro e a página mostra a mensagem genérica.

Plano de correção:
1. Validar a geração do link no `whatsapp-webhook`
   - Garantir que a Sofia sempre envie o domínio publicado correto: `https://www.hrimoveis.com/agendar/{token}`.
   - Ajustar a mensagem para colocar o link em uma linha separada, sem texto colado depois dele, reduzindo risco do WhatsApp cortar ou quebrar a URL.

2. Melhorar o diagnóstico na página `/agendar/:token`
   - Separar claramente os estados: link inválido, link expirado, falha temporária para carregar agenda e sem horários disponíveis.
   - Evitar “página em branco” caso a resposta da função venha vazia, HTML, erro de rede ou JSON inválido.
   - Exibir uma mensagem útil pedindo para solicitar novo link à Sofia, sem deixar o lead perdido.

3. Tornar a busca do agendamento mais robusta
   - No frontend, checar `res.ok` antes de tentar usar os dados.
   - Se a função retornar erro temporário, mostrar uma tela de erro amigável em vez de quebrar a renderização.

4. Verificar o fluxo após a alteração
   - Testar o link recente da Larissa.
   - Testar um token inválido para confirmar que aparece a mensagem correta.
   - Confirmar que os horários aparecem quando o token é válido.