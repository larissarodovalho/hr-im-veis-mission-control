# Corrigir "Link não encontrado" na página pública do imóvel

## Diagnóstico confirmado

O link `HR-Z2JJTR` está válido e ativo no banco. Testando o serviço público direto:

- Origem `https://hrimoveis.com` → resposta `status: "ativo"` com o imóvel e as fotos.
- Origem de pré-visualização `...lovableproject.com` → mesma resposta, porém com `access-control-allow-origin: null`.

Ou seja: o navegador bloqueia a resposta quando o link é aberto no domínio de pré-visualização, porque esse domínio não está na lista de origens permitidas do serviço (hoje só localhost, `*.lovable.app` e `hrimoveis.com`). A página trata qualquer falha como "link inexistente" e mostra "Link não encontrado".

Em produção (`hrimoveis.com` / `royal-dashboard.lovable.app`) o link já abre normalmente — o problema aparece nos testes feitos pelo endereço de pré-visualização.

## O que será feito

1. Liberar também o domínio de pré-visualização (`*.lovableproject.com`) na lista de origens permitidas do serviço público, mantendo a restrição para todo o resto.
2. Separar "falha de conexão" de "link inexistente" na página pública: em caso de erro de rede/CORS, mostrar "Não foi possível carregar a apresentação. Verifique sua conexão e tente novamente." com botão "Tentar novamente", em vez de "Link não encontrado".
3. Revalidar abrindo o mesmo link em pré-visualização e no domínio publicado, conferindo fotos, contagem regressiva e registro de abertura.

## Detalhes técnicos

- `supabase/functions/imovel-link-publico/index.ts`: acrescentar `/\.lovableproject\.com$/` (e `/\.sandbox\.lovable\.dev$/` se aplicável) a `ORIGENS_PERMITIDAS`.
- `src/lib/imovelLinks.ts` (`abrirLink`): retornar um estado distinto, ex. `status: "erro_rede"`, quando o fetch falhar, em vez de `null`.
- `src/pages/LinkImovelPublico.tsx`: tratar `erro_rede` com mensagem e botão de nova tentativa; demais estados (revogado, expirado, indisponível, inválido) permanecem como estão.

Nenhuma alteração de banco de dados, RLS ou regra de negócio.
