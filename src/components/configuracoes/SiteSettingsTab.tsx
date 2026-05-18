import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, RotateCcw, Star, X } from "lucide-react";
import { toast } from "sonner";
import {
  SITE_IMAGE_LABELS,
  SiteImageKey,
  fetchFeaturedImoveis,
  fetchSiteImages,
  saveFeaturedImoveis,
  saveSiteImage,
  uploadSiteAsset,
} from "@/lib/siteSettings";
import { supabase } from "@/integrations/supabase/client";

// Default fallback images bundled with the site
import heroHomeDefault from "@/assets/hero-dark.jpg";
import heroImoveisDefault from "@/assets/imoveis/hero-imoveis.jpg";
import sectionLivingDefault from "@/assets/section-living.jpg";
import sectionCommunityDefault from "@/assets/section-community.jpg";
import featureInteriorDefault from "@/assets/feature-interior.jpg";

const DEFAULTS: Record<SiteImageKey, string> = {
  hero_home: heroHomeDefault,
  hero_imoveis: heroImoveisDefault,
  hero_contato: heroHomeDefault,
  section_living: sectionLivingDefault,
  section_community: sectionCommunityDefault,
  feature_interior: featureInteriorDefault,
};

const HERO_KEYS: SiteImageKey[] = ["hero_home", "hero_imoveis", "hero_contato"];
const SECTION_KEYS: SiteImageKey[] = ["section_living", "section_community", "feature_interior"];

export default function SiteSettingsTab() {
  const [images, setImages] = useState<Partial<Record<SiteImageKey, string>>>({});
  const [loading, setLoading] = useState(true);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [savingFeatured, setSavingFeatured] = useState(false);

  async function reloadAll() {
    setLoading(true);
    const [imgs, feat, im] = await Promise.all([
      fetchSiteImages(),
      fetchFeaturedImoveis(),
      supabase
        .from("imoveis")
        .select("id, titulo, cidade, valor, fotos, status")
        .order("created_at", { ascending: false }),
    ]);
    setImages(imgs);
    setFeaturedIds(feat);
    setImoveis(im.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    reloadAll();
  }, []);

  async function handleUpload(key: SiteImageKey, file: File) {
    try {
      const url = await uploadSiteAsset(file, key);
      await saveSiteImage(key, url);
      setImages((s) => ({ ...s, [key]: url }));
      toast.success("Imagem atualizada");
    } catch (e: any) {
      toast.error(e.message || "Falha no upload");
    }
  }

  async function handleRestore(key: SiteImageKey) {
    try {
      await saveSiteImage(key, null);
      setImages((s) => {
        const n = { ...s };
        delete n[key];
        return n;
      });
      toast.success("Imagem restaurada para o padrão");
    } catch (e: any) {
      toast.error(e.message || "Falha ao restaurar");
    }
  }

  function toggleFeatured(id: string) {
    setFeaturedIds((curr) => {
      if (curr.includes(id)) return curr.filter((x) => x !== id);
      if (curr.length >= 3) {
        toast.info("Máximo de 3 imóveis em destaque. Remova um antes de adicionar.");
        return curr;
      }
      return [...curr, id];
    });
  }

  async function persistFeatured() {
    setSavingFeatured(true);
    try {
      await saveFeaturedImoveis(featuredIds);
      toast.success("Imóveis em destaque salvos");
    } catch (e: any) {
      toast.error(e.message || "Falha ao salvar");
    } finally {
      setSavingFeatured(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Imagens do hero (capas)</CardTitle>
          <CardDescription>Imagem grande de abertura das páginas do site público.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HERO_KEYS.map((k) => (
            <ImageSlot
              key={k}
              k={k}
              current={images[k] || DEFAULTS[k]}
              isCustom={!!images[k]}
              onUpload={(f) => handleUpload(k, f)}
              onRestore={() => handleRestore(k)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imagens das seções internas</CardTitle>
          <CardDescription>Fotos que aparecem entre os blocos de conteúdo nas páginas Início e Sobre.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SECTION_KEYS.map((k) => (
            <ImageSlot
              key={k}
              k={k}
              current={images[k] || DEFAULTS[k]}
              isCustom={!!images[k]}
              onUpload={(f) => handleUpload(k, f)}
              onRestore={() => handleRestore(k)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" /> Imóveis em destaque na home</CardTitle>
          <CardDescription>
            Os imóveis marcados com "Imóvel em destaque" no cadastro aparecem automaticamente na home (até 3, mais recentes primeiro).
            Use esta lista para complementar caso haja menos de 3 marcados, ou para fixar imóveis específicos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {featuredIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Selecionados ({featuredIds.length}/3)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {featuredIds.map((id) => {
                  const im = imoveis.find((x) => x.id === id);
                  if (!im) return (
                    <div key={id} className="rounded-lg border p-3 text-xs text-muted-foreground">
                      Imóvel removido ({id.slice(0, 8)})
                      <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => toggleFeatured(id)}>
                        <X className="h-3 w-3 mr-1" /> Remover
                      </Button>
                    </div>
                  );
                  return (
                    <div key={id} className="rounded-lg border overflow-hidden">
                      {im.fotos?.[0] ? (
                        <img src={im.fotos[0]} alt={im.titulo} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 bg-muted" />
                      )}
                      <div className="p-2 space-y-1">
                        <p className="text-xs font-medium truncate">{im.titulo}</p>
                        <p className="text-[10px] text-muted-foreground">{im.cidade}</p>
                        <Button size="sm" variant="ghost" className="w-full h-7 text-xs" onClick={() => toggleFeatured(id)}>
                          <X className="h-3 w-3 mr-1" /> Remover
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button onClick={persistFeatured} disabled={savingFeatured}>
                {savingFeatured ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Salvar destaques
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Disponíveis</p>
            {imoveis.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nenhum imóvel cadastrado. Adicione imóveis em <strong>Imóveis</strong> primeiro.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {imoveis
                  .filter((i) => !featuredIds.includes(i.id))
                  .map((im) => (
                    <button
                      key={im.id}
                      type="button"
                      onClick={() => toggleFeatured(im.id)}
                      className="text-left rounded-lg border hover:border-primary transition-colors overflow-hidden bg-card"
                    >
                      {im.fotos?.[0] ? (
                        <img src={im.fotos[0]} alt={im.titulo} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 bg-muted" />
                      )}
                      <div className="p-2 space-y-0.5">
                        <p className="text-xs font-medium truncate">{im.titulo}</p>
                        <p className="text-[10px] text-muted-foreground">{im.cidade}</p>
                        <Badge variant="outline" className="text-[9px] mt-1">{im.status}</Badge>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ImageSlot({
  k,
  current,
  isCustom,
  onUpload,
  onRestore,
}: {
  k: SiteImageKey;
  current: string;
  isCustom: boolean;
  onUpload: (file: File) => Promise<void>;
  onRestore: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const meta = SITE_IMAGE_LABELS[k];

  return (
    <div className="rounded-lg border overflow-hidden bg-card">
      <div className="relative aspect-video bg-muted">
        <img src={current} alt={meta.label} className="w-full h-full object-cover" />
        {isCustom && (
          <Badge className="absolute top-2 right-2 text-[10px]">Personalizada</Badge>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div>
          <p className="text-sm font-medium">{meta.label}</p>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try { await onUpload(file); }
            finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
          }}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
            Trocar
          </Button>
          {isCustom && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={async () => {
              setBusy(true);
              try { await onRestore(); } finally { setBusy(false); }
            }}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
