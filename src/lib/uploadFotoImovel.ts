import { supabase } from "@/integrations/supabase/client";
import { applyWatermark } from "@/lib/watermark";

export const IMOVEIS_BUCKET = "imoveis";
export const ORIGINAIS_BUCKET = "imoveis-originais";

/**
 * Faz upload de uma foto de imóvel salvando 2 versões:
 *  - bucket "imoveis"           => versão pública com marca d'água
 *  - bucket "imoveis-originais" => versão original (privada)
 * Usa o MESMO path nos dois buckets para casar original ↔ marca d'água.
 *
 * Retorna a URL pública da versão com marca d'água, ou null em caso de falha.
 */
export async function uploadFotoImovel(
  original: File,
  userId: string,
): Promise<{ publicUrl: string; path: string } | null> {
  const safeName = original.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  // path final SEMPRE termina em .jpg (igual ao applyWatermark)
  const baseName = safeName.replace(/\.[^.]+$/, "") || "foto";
  const path = `${userId}/${Date.now()}-${baseName}.jpg`;

  // 1) Sobe original (privado)
  const { error: origErr } = await supabase.storage
    .from(ORIGINAIS_BUCKET)
    .upload(path, original, {
      cacheControl: "3600",
      upsert: false,
      contentType: original.type || "image/jpeg",
    });
  if (origErr) {
    // Não falha o fluxo principal — apenas loga; ainda tentamos subir a versão com marca
    console.warn("[uploadFotoImovel] falha ao salvar original:", origErr.message);
  }

  // 2) Aplica marca d'água e sobe versão pública
  const stamped = await applyWatermark(original);
  const { error: upErr } = await supabase.storage
    .from(IMOVEIS_BUCKET)
    .upload(path, stamped, {
      cacheControl: "3600",
      upsert: false,
      contentType: stamped.type,
    });
  if (upErr) {
    console.error("[uploadFotoImovel] falha ao salvar com marca:", upErr.message);
    // Limpa original que não tem par
    await supabase.storage.from(ORIGINAIS_BUCKET).remove([path]).catch(() => {});
    return null;
  }

  const { data: pub } = supabase.storage.from(IMOVEIS_BUCKET).getPublicUrl(path);
  return { publicUrl: pub.publicUrl, path };
}

/**
 * Dada a URL pública de uma foto no bucket "imoveis", retorna o path interno
 * (que é o mesmo path usado no bucket de originais).
 */
export function extractImovelPath(url: string): string | null {
  const m = url.match(/\/imoveis\/(.+?)(?:\?.*)?$/);
  return m ? m[1] : null;
}

/**
 * Baixa em ZIP as fotos originais (sem marca d'água) correspondentes às URLs
 * passadas. Pula silenciosamente as que não têm original disponível.
 * Retorna { ok, missing } com a contagem.
 */
export async function baixarOriginaisZip(
  urls: string[],
  zipFileName = "fotos-originais.zip",
): Promise<{ ok: number; missing: number }> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  let ok = 0;
  let missing = 0;

  for (const url of urls) {
    const path = extractImovelPath(url);
    if (!path) {
      missing++;
      continue;
    }
    const { data, error } = await supabase.storage
      .from(ORIGINAIS_BUCKET)
      .download(path);
    if (error || !data) {
      missing++;
      continue;
    }
    const fileName = path.split("/").pop() || `foto-${ok + 1}.jpg`;
    zip.file(fileName, data);
    ok++;
  }

  if (ok === 0) return { ok, missing };

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { ok, missing };
}
