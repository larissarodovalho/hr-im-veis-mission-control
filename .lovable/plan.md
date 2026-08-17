# Links temporários sempre no domínio hrimoveis.com

## Problema

O link compartilhado hoje é montado com o endereço da janela onde o corretor está (`window.location.origin`). Quando o corretor gera o link dentro do ambiente de pré-visualização da Lovable, o endereço copiado é o da pré-visualização — e esse endereço pede login da plataforma. O cliente final recebe uma tela de login em vez da apresentação.

A rota pública `/l/:token` já está fora da área protegida do CRM: no site publicado (hrimoveis.com) ela abre normalmente, sem login.

## Solução

Fixar o domínio público da HR Imóveis na geração do link, independentemente de onde o corretor esteja usando o CRM.

- Link gerado sempre no formato `https://www.hrimoveis.com/l/<token>` — usado na cópia do link, no texto de WhatsApp, no QR Code e no botão "abrir em nova aba".
- Em desenvolvimento local (localhost) o link continua apontando para o próprio localhost, para permitir testes.
- Nada muda no funcionamento, validade, métricas ou segurança dos links; apenas o endereço divulgado.

## Detalhes técnicos

- `src/lib/imovelLinks.ts`: `urlDoLink()` passa a usar uma constante de domínio público (`https://www.hrimoveis.com`), com exceção para `localhost`, em vez de `window.location.origin`.
- Verificar os demais pontos que exibem/copiam o link (diálogo de compartilhamento, detalhes do link, aba de links) para garantir que todos usem `urlDoLink()`.
- A função pública já libera a origem `hrimoveis.com` no CORS; nenhuma mudança de backend é necessária.

## Observação

Para que os links funcionem no domínio, o app precisa estar publicado com a rota `/l/:token` — já é o caso hoje. Alterações de frontend só chegam ao domínio após clicar em "Publicar/Atualizar".
