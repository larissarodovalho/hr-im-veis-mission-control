import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteImageKey =
  | "hero_home"
  | "hero_imoveis"
  | "hero_contato"
  | "section_living"
  | "section_community"
  | "feature_interior";

export const SITE_IMAGE_LABELS: Record<SiteImageKey, { label: string; description: string }> = {
  hero_home: { label: "Hero — Início", description: "Imagem grande de abertura da página inicial do site." },
  hero_imoveis: { label: "Hero — Imóveis", description: "Imagem de capa da página /site/imoveis." },
  hero_contato: { label: "Hero — Contato", description: "Imagem de capa da página /site/contato." },
  section_living: { label: "Seção — Living", description: "Imagem 'living' usada em Início, Sobre e Contato." },
  section_community: { label: "Seção — Community", description: "Imagem 'community' usada em Início e Sobre." },
  feature_interior: { label: "Seção — Interior", description: "Imagem 'interior' usada em Início e Sobre." },
};

const TABLE = "site_settings" as const;
const IMAGES_KEY = "images";
const FEATURED_KEY = "featured_imoveis";

type ImagesRecord = Partial<Record<SiteImageKey, string>>;

let imagesCache: ImagesRecord | null = null;
let imagesPromise: Promise<ImagesRecord> | null = null;

export async function fetchSiteImages(): Promise<ImagesRecord> {
  if (imagesCache) return imagesCache;
  if (imagesPromise) return imagesPromise;
  imagesPromise = (async () => {
    const { data } = await supabase
      .from(TABLE as any)
      .select("value")
      .eq("key", IMAGES_KEY)
      .maybeSingle();
    const value = (data as any)?.value;
    const result = (value && typeof value === "object" ? value : {}) as ImagesRecord;
    imagesCache = result;
    return result;
  })();
  return imagesPromise;
}

export function invalidateSiteImagesCache() {
  imagesCache = null;
  imagesPromise = null;
}

export async function saveSiteImage(key: SiteImageKey, url: string | null) {
  const current = await fetchSiteImages();
  const next: ImagesRecord = { ...current };
  if (url) next[key] = url;
  else delete next[key];
  const { error } = await supabase
    .from(TABLE as any)
    .upsert({ key: IMAGES_KEY, value: next as any }, { onConflict: "key" });
  if (error) throw error;
  invalidateSiteImagesCache();
}

export async function fetchFeaturedImoveis(): Promise<string[]> {
  const { data } = await supabase
    .from(TABLE as any)
    .select("value")
    .eq("key", FEATURED_KEY)
    .maybeSingle();
  const value = (data as any)?.value;
  const ids = (value && Array.isArray((value as any).ids) ? (value as any).ids : []) as string[];
  return ids;
}

export async function saveFeaturedImoveis(ids: string[]) {
  const { error } = await supabase
    .from(TABLE as any)
    .upsert({ key: FEATURED_KEY, value: { ids } as any }, { onConflict: "key" });
  if (error) throw error;
}

export async function uploadSiteAsset(file: File, key: SiteImageKey): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${key}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  return data.publicUrl;
}

/** Hook: returns a resolver `img(key, fallback)` plus the raw map. */
export function useSiteImages() {
  const [map, setMap] = useState<ImagesRecord>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetchSiteImages()
      .then((m) => setMap(m))
      .finally(() => setLoaded(true));
  }, []);
  const img = (key: SiteImageKey, fallback: string) => map[key] || fallback;
  return { img, map, loaded };
}
