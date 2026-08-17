// Entrega fotos do storage já redimensionadas pelo servidor de imagens,
// evitando baixar o arquivo original (até 500 KB) em miniaturas e galerias.

const PUBLIC_MARK = "/storage/v1/object/public/";
const RENDER_MARK = "/storage/v1/render/image/public/";

export interface OpcoesImagem {
  width?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
}

/** Larguras padrão por contexto de uso. */
export const IMG_THUMB = { width: 400, quality: 65 } as const;
export const IMG_CARD = { width: 700, quality: 70 } as const;
export const IMG_GALERIA = { width: 1400, quality: 75 } as const;
export const IMG_HERO = { width: 1920, quality: 78 } as const;

export function imagemOtimizada(
  url: string | null | undefined,
  opts: OpcoesImagem = IMG_CARD,
): string {
  if (!url) return "";
  // Só URLs públicas do storage passam pelo transformador.
  if (!url.includes(PUBLIC_MARK)) return url;
  // Já transformada: mantém como está.
  if (url.includes(RENDER_MARK)) return url;

  const [base, query] = url.split("?");
  const alvo = base.replace(PUBLIC_MARK, RENDER_MARK);
  const params = new URLSearchParams(query || "");
  if (opts.width) params.set("width", String(opts.width));
  if (opts.quality) params.set("quality", String(opts.quality));
  params.set("resize", opts.resize ?? "cover");
  return `${alvo}?${params.toString()}`;
}
