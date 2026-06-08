# Reduzir spam no informativo

O domínio `notify.hrimoveis.com` está verificado e a Lovable já configura SPF, DKIM e cuida da assinatura. O que faz cair em spam, no seu caso, é uma combinação de **conteúdo do e-mail + reputação nova do remetente + filtro agressivo do Hotmail/Outlook**. Vou agir em três frentes.

## 1. Ajustes no template do informativo (o que mais pesa hoje)

Mudanças no `newsletter-weekly.tsx` que reduzem score de spam:

- **Assunto mais específico e menos "promocional"**: trocar "Novidades do mercado imobiliário — Sinop" por algo curto, sem palavras gatilho (evitar "novidades", "imperdível", "oferta", "destaques", excesso de travessões e emojis). Ex.: `HR Imóveis · Boletim semanal de Sinop`.
- **Preheader real** (texto curto que aparece ao lado do assunto na caixa de entrada) — hoje está repetindo o assunto.
- **Reduzir proporção imagem/texto**: hoje cada imóvel tem foto grande + pouco texto. Filtros pontuam mal e-mails "image-heavy". Vou:
  - manter só 1 foto por imóvel, com `alt` descritivo
  - garantir bloco de texto inicial substancial (mínimo ~400 caracteres)
  - garantir versão em texto puro rica (o sistema já gera, mas vou conferir)
- **Reduzir número de links externos**: hoje cada card tem 3 links para o mesmo destino. Vou consolidar em 1 link por imóvel + 1 link de site no rodapé.
- **From name limpo**: usar `HR Imóveis <suporte@hrimoveis.com>` (já está) e garantir `Reply-To` para um endereço monitorado (ex.: `contato@hrimoveis.com`) — filtros confiam mais quando há reply-to válido.
- **Sem URLs encurtadas, sem rastreadores de terceiros, sem tabelas aninhadas extras.**
- **Texto de descadastro visível** (o sistema já injeta o link no rodapé; vou conferir que aparece em texto claro, não só como link).

## 2. Recomendação de DMARC no domínio raiz (ação sua, fora do código)

A Lovable cuida de SPF/DKIM no subdomínio `notify.hrimoveis.com`. Para o Hotmail/Outlook ser menos rígido, ajuda muito ter um registro **DMARC** publicado em `hrimoveis.com`. Sugestão para começar:

```text
Tipo: TXT
Nome: _dmarc.hrimoveis.com
Valor: v=DMARC1; p=none; rua=mailto:dmarc@hrimoveis.com; fo=1
```

Isso só **monitora** (não bloqueia nada) e melhora o sinal de autenticidade para Microsoft/Google. Você adiciona no provedor onde o domínio `hrimoveis.com` está hospedado. Posso te lembrar onde colar, mas não consigo aplicar por você — é fora da Lovable.

## 3. Aquecimento e teste

- Endereços `@hotmail.com` são notoriamente os mais rigorosos. Mesmo com tudo certo, os 5–10 primeiros envios para Hotmail tendem a cair em "Lixo Eletrônico" enquanto a reputação do subdomínio "esquenta". A solução prática:
  - marcar o e-mail como "Não é lixo eletrônico" e adicionar `suporte@hrimoveis.com` aos contatos no Hotmail de teste
  - enviar primeiros envios reais para destinatários que abrem/respondem (sua equipe, parceiros próximos)
- Vou também adicionar um botão **"Testar no Gmail"** com input livre, para você comparar inbox/spam entre Gmail e Outlook.
- Posso (opcional) gerar uma URL pública para checar o e-mail em https://www.mail-tester.com/ — você envia para o endereço dele e ele dá uma nota de 0–10 com as causas exatas de spam. Útil para validar antes de disparar campanha real.

## O que muda em código

- `supabase/functions/_shared/transactional-email-templates/newsletter-weekly.tsx` — assunto padrão, preheader, redução de links/imagens, alt text, parágrafo de abertura.
- `supabase/functions/send-transactional-email/index.ts` — adicionar header `Reply-To: contato@hrimoveis.com` no payload enfileirado (campo já suportado pelo dispatcher).
- `src/pages/NewsletterCampanhas.tsx` — segundo input opcional de "e-mail de teste" para facilitar comparação Gmail vs Outlook.
- Re-deploy das funções afetadas.

## Fora do escopo (só sinalizando)

Não vou desabilitar Lovable Emails nem migrar para Resend/SendGrid — não é necessário e pioraria, porque o subdomínio `notify.hrimoveis.com` está delegado para a Lovable.

---

Confirma que posso aplicar os ajustes do item 1 e do item 3 (código)? O item 2 (DMARC) eu te explico onde colar quando você for adicionar.
