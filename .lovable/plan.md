## Objetivo

Melhorar a legibilidade dos textos pequenos em todas as páginas do site público (`/site/*`), sem alterar a hierarquia visual nem o layout.

## Diagnóstico

Os textos pequenos têm dois problemas combinados:
1. **Tamanho**: muito uso de `text-xs` (12px) e `text-sm` (14px).
2. **Opacidade muito baixa**: `text-white/20`, `text-white/30`, `text-white/35` sobre fundo escuro — o contraste fica abaixo do recomendado e os textos quase somem.

O segundo ponto é, na prática, o que mais impacta a leitura.

## Mudanças propostas

Aplicar em todos os arquivos de `src/pages/site/*` e `src/components/site/SiteLayout.tsx`:

### 1. Tamanho (aumento sutil de um passo)
- Parágrafos descritivos: `text-sm` → `text-base`
- Textos auxiliares pequenos (cards, listas, rodapé): `text-xs` → `text-sm`
- Exceções mantidas em `text-xs`: rótulos com `uppercase tracking-[0.x em]` (eyebrows/labels estilizados), pois aumentar quebraria o efeito tipográfico.

### 2. Opacidade (aumento de contraste)
- `text-white/20` → `text-white/50`
- `text-white/30` → `text-white/60`
- `text-white/35` → `text-white/60`
- `text-white/40` → `text-white/65` (apenas em corpo de texto, não em eyebrows decorativos)
- Estados `group-hover:text-white/35` e similares ajustados proporcionalmente.

### 3. Escopo dos arquivos
- `src/pages/site/HomePage.tsx`
- `src/pages/site/SobrePage.tsx`
- `src/pages/site/ImoveisPage.tsx`
- `src/pages/site/ImovelDetalhePage.tsx`
- `src/pages/site/ContatoPage.tsx`
- `src/components/site/SiteLayout.tsx` (rodapé e navegação mobile)

## Fora do escopo

- CRM e telas administrativas — só o site público.
- Não muda fontes, cores de marca, espaçamentos, nem estrutura de seções.
- Eyebrows decorativos (`uppercase tracking-wider`) mantêm `text-xs` para preservar o estilo editorial.
