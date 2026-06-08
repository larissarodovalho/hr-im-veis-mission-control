## Objetivo

Disparar um email real usando o template `newsletter-weekly` para `larissadefreitas@hotmail.com`, com manchete + texto de exemplo e 3 imóveis reais do catálogo, só para você ver o visual.

## Como vai funcionar

1. Criar uma edge function nova `newsletter-send-test` que:
   - Busca os 3 imóveis mais recentes com `status = 'disponivel'` (com foto, título, preço, localização, quartos, vagas, área).
   - Monta um `templateData` de exemplo:
     - Assunto: "Novidades do mercado imobiliário — Sinop"
     - Manchete: "O que está movimentando o mercado esta semana"
     - Texto: parágrafo curto fictício sobre o mercado de Sinop.
   - Invoca `send-transactional-email` com `templateName: 'newsletter-weekly'`, recipient fixo do parâmetro, `idempotencyKey` único por timestamp (para permitir reenvios).
   - Protegida: só usuários `admin`/`gestor` podem chamar.

2. Adicionar um botão **"Enviar email de teste"** no topo da aba Newsletter → Campanhas, abrindo um diálogo simples com campo de email (pré-preenchido `larissadefreitas@hotmail.com`) e botão "Enviar".

3. Disparar o envio uma vez para `larissadefreitas@hotmail.com` para você conferir na caixa de entrada.

## Observações

- Usa a infraestrutura de email já configurada (fila pgmq + `send-transactional-email`).
- O email chega com o footer padrão de unsubscribe (do sistema).
- Caso o email não chegue, eu checo os logs de `send-transactional-email` e `process-email-queue`.
