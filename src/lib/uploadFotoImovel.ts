import { supabase } from "@/integrations/supabase/client";
import { applyWatermark } from "@/lib/watermark";

export const IMOVEIS_BUCKET = "imoveis";
export const ORIGINAIS_BUCKET = "imoveis-originais";
/** Bucket privado usado pelos links temporários (fotos com marca d'água, servidas por URL assinada) */
export const COMPARTILHADOS_BUCKET = "imoveis-compartilhados";

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

  // 3) Espelha a versão com marca d'água no bucket privado dos links temporários
  await supabase.storage
    .from(COMPARTILHADOS_BUCKET)
    .upload(path, stamped, {
      cacheControl: "3600",
      upsert: true,
      contentType: stamped.type,
    })
    .then(({ error }) => {
      if (error) console.warn("[uploadFotoImovel] falha ao espelhar compartilhado:", error.message);
    });

  const { data: pub } = supabase.storage.from(IMOVEIS_BUCKET).getPublicUrl(path);
  return { publicUrl: pub.publicUrl, path };
}

/**
 * Garante que as fotos informadas (URLs públicas do bucket "imoveis") existam
 * também no bucket privado "imoveis-compartilhados", usado pelos links temporários.
 * Retorna os paths disponíveis no bucket privado.
 */
export async function sincronizarFotosCompartilhadas(urls: string[]): Promise<string[]> {
  const paths: string[] = [];
  for (const url of urls) {
    const path = extractImovelPath(url);
    if (!path) continue;

    // Já existe?
    const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    const name = path.split("/").pop()!;
    const { data: list } = await supabase.storage
      .from(COMPARTILHADOS_BUCKET)
      .list(dir, { search: name, limit: 1 });
    if (list?.some((f) => f.name === name)) {
      paths.push(path);
      continue;
    }

    const { data: file, error } = await supabase.storage.from(IMOVEIS_BUCKET).download(path);
    if (error || !file) continue;
    const { error: upErr } = await supabase.storage
      .from(COMPARTILHADOS_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type || "image/jpeg" });
    if (!upErr) paths.push(path);
  }
  return paths;
}

/** Gera URLs assinadas temporárias para fotos do bucket privado dos links. */
export async function assinarFotosCompartilhadas(
  paths: string[],
  expiresInSeconds = 3600,
): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data, error } = await supabase.storage
    .from(COMPARTILHADOS_BUCKET)
    .createSignedUrls(paths, expiresInSeconds);
  if (error || !data) return [];
  return data.map((d) => d.signedUrl).filter(Boolean) as string[];
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
