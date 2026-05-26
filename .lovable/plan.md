## Reordenar fotos por arrastar — Editar imóvel

Adicionar drag-and-drop nas "Fotos atuais" do diálogo de edição de imóveis para que você defina a ordem de exibição (a primeira foto é a capa).

### O que muda
- Em `src/components/imoveis/EditarImovelDialog.tsx`, na grade de fotos existentes:
  - Cada miniatura passa a ser arrastável (HTML5 drag-and-drop nativo, sem nova dependência).
  - Ao soltar uma foto sobre outra, a ordem do array `fotosExistentes` é reorganizada.
  - Indicador visual durante o arraste (opacidade + borda destacada no alvo) e um pequeno selo "Capa" na primeira foto.
  - Um texto curto de ajuda: "Arraste para reordenar. A primeira foto é a capa."
- Ao salvar, a nova ordem é persistida (já acontece hoje — o `update` envia `fotos: [...fotosExistentes, ...novasUrls]`).

### Fora do escopo
- Reordenar "Novas fotos" antes do upload (posso incluir depois se quiser).
- Mudanças na aba de cadastro de novo imóvel.
- Mudanças no backend / banco — apenas frontend.
