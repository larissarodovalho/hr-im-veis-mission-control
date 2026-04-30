## Diagnóstico

Dois problemas:

1. **Link não abre para o lead**: o webhook gera o link com domínio `id-preview--*.lovable.app`, que é **privado** (exige login Lovable). O domínio público correto da HR Imóveis é `https://www.hrimoveis.com`.
2. **Página `/agendar/:token` sem identidade**: usa estilo genérico (fundo claro, sem logo). O site da HR Imóveis tem identidade dark (`#0a0a0a`) com logo branco em `@/assets/logo-hr-branco.png`.

## Mudanças

### 1. `supabase/functions/whatsapp-webhook/index.ts` (linhas 669-671)

Trocar o fallback do `baseUrl` para o domínio publicado:
```ts
const baseUrl = Deno.env.get("PUBLIC_APP_URL") || "https://www.hrimoveis.com";
const link = `${baseUrl.replace(/\/$/, "")}/agendar/${token}`;
```

Redeployar `whatsapp-webhook`.

### 2. `src/pages/AgendarPage.tsx` — redesign com a marca HR Imóveis

- Importar `hrLogo` de `@/assets/logo-hr-branco.png`.
- Fundo dark (`bg-[#0a0a0a] text-white`), igual ao SiteLayout.
- Topo: barra com logo HR Imóveis centralizado (h-12).
- Card central com fundo `bg-white/5 border-white/10` (estilo glass), bordas arredondadas, sombra sutil.
- Título com fonte display, subtítulo branco/60.
- Calendário e botões com tema escuro (botões selecionados em branco/preto, não-selecionados `bg-white/5 hover:bg-white/10`).
- Botão "Confirmar" branco com texto preto (mesma CTA do site).
- Estados de erro/sucesso (`Status`) com ícones em círculo translúcido sobre o dark.
- Rodapé minimalista: "HR Imóveis · Hans Rodovalho · Sinop-MT" em white/30.

Sem mudanças funcionais — só visual. Lógica de carregar slots, confirmar e tratar token usado/expirado permanece intacta.

## Fora de escopo
- Não toco em outras páginas nem no fluxo do webhook além da URL base.
- Não adiciono imagens de imóveis (só logo + paleta da marca, já é "bonitinho e organizado" como pediu).
