// Aplica marca d'água com a logo da HR Imóveis nas fotos antes do upload.
const LOGO_URL = "/logo-hr-branco.png";

let logoPromise: Promise<HTMLImageElement> | null = null;

function loadLogo(): Promise<HTMLImageElement> {
  if (!logoPromise) {
    logoPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = LOGO_URL;
    });
  }
  return logoPromise;
}

export interface WatermarkOptions {
  opacity?: number;       // 0..1
  widthRatio?: number;    // fração da menor dimensão da foto
  marginRatio?: number;   // fração da menor dimensão da foto
  quality?: number;       // 0..1
  maxDimension?: number;  // limita lado maior pra não explodir memória
}

export async function applyWatermark(
  file: File,
  opts: WatermarkOptions = {}
): Promise<File> {
  const {
    opacity = 0.35,
    widthRatio = 0.38,
    quality = 0.9,
    maxDimension = 2400,
  } = opts;

  // Só processa imagens raster
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as any).catch(() => createImageBitmap(file));

    let { width, height } = bitmap;
    if (width < 400 || height < 400) {
      bitmap.close?.();
      return file;
    }

    // Limita tamanho máximo proporcional
    const longest = Math.max(width, height);
    if (longest > maxDimension) {
      const scale = maxDimension / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const logo = await loadLogo();
    const minSide = Math.min(width, height);
    const logoW = Math.round(minSide * widthRatio);
    const logoH = Math.round((logo.height / logo.width) * logoW);
    const x = Math.round((width - logoW) / 2);
    const y = Math.round((height - logoH) / 2);

    // Sombra sutil pra logo ficar legível sobre qualquer fundo
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = Math.max(6, Math.round(minSide * 0.008));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.drawImage(logo, x, y, logoW, logoH);
    ctx.restore();


    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (e) {
    console.warn("[watermark] falhou, usando original:", e);
    return file;
  }
}
