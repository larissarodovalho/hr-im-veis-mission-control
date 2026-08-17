# Fotos mais rápidas no CRM, no site e nos links temporários

## O que está acontecendo

As fotos são servidas sempre no tamanho original em que foram salvas: até 2400px de lado e qualidade 90%. Medido em uma foto real do sistema: **482 KB** para uma única imagem. Uma galeria com 16 fotos carrega perto de 7 MB; imóveis com 55 fotos passam de 25 MB. Por isso a sensação de "peso" ao passar as fotos, principalmente no celular e em 4G.

Também foi confirmado que o serviço de imagens do backend consegue redimensionar sob demanda: a mesma foto, pedida com 600px de largura e qualidade 70, vem com **61 KB** — cerca de 8x menor, sem diferença visível em miniatura.

## O que será feito

1. **Servir cada foto no tamanho em que ela realmente aparece**
   - Miniaturas e cards (CRM, listagens do site, seleção de imóveis): versão leve (~400–600px).
   - Galeria/foto grande (detalhe do imóvel, links temporários): versão média (~1400px, qualidade 70–75).
   - Original só quando a pessoa abre a foto em tela cheia.

2. **Carregamento inteligente na galeria**
   - Primeira foto carrega com prioridade; as demais carregam sob demanda enquanto o cliente navega, com pré-carregamento apenas da próxima e da anterior.
   - `loading="lazy"` e `decoding="async"` padronizados em todos os pontos que mostram fotos.

3. **Links temporários (fotos privadas)**
   - As URLs assinadas passam a ser geradas já na versão redimensionada, mantendo a mesma segurança e validade atuais.
   - Assinatura em lotes paralelos para não aumentar o tempo de abertura da página.

4. **Fotos novas mais leves no upload**
   - A marca d'água continua igual, mas a foto final passa a ser salva em até 1920px com qualidade 80 (hoje 2400px / 90). Reduz de imediato o peso das fotos cadastradas daqui pra frente, sem perda visível.

## Detalhes técnicos

- Novo helper `src/lib/imagemOtimizada.ts` que converte a URL pública de storage (`/object/public/...`) para a URL de transformação (`/render/image/public/...?width=&quality=&resize=contain`) e devolve a URL original quando não for do storage do projeto.
- Aplicar o helper nos pontos que exibem fotos: cards e galerias do CRM (`src/pages/Imoveis.tsx` e componentes de `src/components/imoveis`), site (`ImoveisPage`, `ImovelDetalhePage`, home) e vínculos de imóveis em contas/oportunidades.
- `supabase/functions/imovel-link-publico/index.ts`: trocar a assinatura em bloco por assinatura com `transform` (largura/qualidade) por foto, executada em lotes paralelos; manter TTL e regras atuais.
- `src/lib/watermark.ts`: `maxDimension` 2400 → 1920 e `quality` 0.9 → 0.8.
- Fotos já cadastradas continuam funcionando: o ganho vem da entrega redimensionada, sem precisar reprocessar nada.

## Fora do escopo

Não haverá reprocessamento em massa das fotos já existentes no storage (a entrega otimizada já resolve o tempo de carregamento).
