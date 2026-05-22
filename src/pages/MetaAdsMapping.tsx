import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useMetaAdsMapping } from "@/hooks/useMetaAdsMapping";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Facebook, Plus, Trash2, Link2, AlertCircle, CheckCircle2, Clock, ExternalLink } from "lucide-react";

interface ImovelOpt { id: string; codigo: string | null; titulo: string; }

export default function MetaAdsMapping() {
  const { mappings, referrals, loading, createMapping, updateMapping, deleteMapping } = useMetaAdsMapping();
  const [imoveis, setImoveis] = useState<ImovelOpt[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adId, setAdId] = useState("");
  const [imovelId, setImovelId] = useState("");
  const [nomeAnuncio, setNomeAnuncio] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    supabase.from("imoveis").select("id, codigo, titulo").order("codigo").then(({ data }) => {
      setImoveis((data as ImovelOpt[]) ?? []);
    });
  }, []);

  const mappedAdIds = useMemo(() => new Set(mappings.map(m => m.ad_id)), [mappings]);
  const referralsSemMap = useMemo(
    () => referrals.filter(r => r.ad_id && !mappedAdIds.has(r.ad_id)),
    [referrals, mappedAdIds]
  );

  const imoveisFiltrados = useMemo(() => {
    if (!busca) return imoveis.slice(0, 20);
    const q = busca.toLowerCase();
    return imoveis.filter(i =>
      (i.codigo ?? "").toLowerCase().includes(q) || i.titulo.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [imoveis, busca]);

  const handleCreate = async () => {
    if (!adId.trim() || !imovelId) return;
    const r = await createMapping({
      ad_id: adId.trim(),
      imovel_id: imovelId,
      nome_anuncio: nomeAnuncio.trim() || null,
    });
    if (!r.error) {
      setAdId(""); setImovelId(""); setNomeAnuncio(""); setBusca("");
      setDialogOpen(false);
    }
  };

  const openWithAdId = (preAdId: string, preTitle?: string | null) => {
    setAdId(preAdId);
    setNomeAnuncio(preTitle ?? "");
    setImovelId("");
    setBusca("");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Facebook className="h-6 w-6 text-primary" /> Anúncios Meta → Imóveis
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Vincule cada anúncio do Meta (Facebook/Instagram) ao imóvel correspondente.
            Quando o lead clicar no anúncio e abrir o WhatsApp, a Sofia identifica o imóvel
            e envia a foto + ficha + link automaticamente.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo vínculo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular anúncio a um imóvel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="ad_id">ID do anúncio (Meta)</Label>
                <Input
                  id="ad_id"
                  placeholder="ex: 120210000123456"
                  value={adId}
                  onChange={(e) => setAdId(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  No Gerenciador de Anúncios da Meta → coluna "ID do anúncio".
                </p>
              </div>
              <div>
                <Label htmlFor="nome">Nome do anúncio (opcional)</Label>
                <Input
                  id="nome"
                  placeholder="ex: Sobrado Jardim Bela Vista"
                  value={nomeAnuncio}
                  onChange={(e) => setNomeAnuncio(e.target.value)}
                />
              </div>
              <div>
                <Label>Imóvel</Label>
                <Input
                  placeholder="Buscar por código ou título..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-60 overflow-y-auto border border-border rounded-md">
                  {imoveisFiltrados.length === 0 && (
                    <div className="p-3 text-xs text-muted-foreground">Nenhum imóvel encontrado.</div>
                  )}
                  {imoveisFiltrados.map((im) => (
                    <button
                      key={im.id}
                      type="button"
                      onClick={() => setImovelId(im.id)}
                      className={`w-full text-left px-3 py-2 text-sm border-b border-border/50 last:border-b-0 hover:bg-muted transition-colors ${
                        imovelId === im.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <span className="font-mono text-xs text-primary mr-2">{im.codigo ?? "—"}</span>
                      {im.titulo}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!adId.trim() || !imovelId}>Salvar vínculo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Referrals sem mapeamento — destaque */}
      {referralsSemMap.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              Anúncios recebidos sem vínculo ({referralsSemMap.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Leads chegaram por esses anúncios mas eles ainda não estão vinculados a um imóvel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {referralsSemMap.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-2 rounded-md bg-card border border-border/50">
                {r.thumbnail_url && (
                  <img src={r.thumbnail_url} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.title || r.body || "(sem título)"}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">ID: {r.ad_id}</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => openWithAdId(r.ad_id!, r.title)}>
                  <Link2 className="h-3 w-3" /> Vincular
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Lista de mapeamentos */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Vínculos ativos ({mappings.length})</h3>
        {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!loading && mappings.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Facebook className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum anúncio vinculado ainda.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Clique em "Novo vínculo" para começar.
              </p>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-3">
          {mappings.map((m) => (
            <Card key={m.id} className={`border-border/50 ${!m.ativo ? "opacity-60" : ""}`}>
              <CardContent className="p-4 flex items-center gap-4">
                {m.imovel?.fotos?.[0] ? (
                  <img src={m.imovel.fotos[0]} alt="" className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <Facebook className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {m.imovel?.codigo ?? "—"}
                    </Badge>
                    <span className="text-sm font-semibold truncate">{m.imovel?.titulo ?? "(imóvel removido)"}</span>
                    {m.ativo
                      ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Ativo</Badge>
                      : <Badge className="bg-muted text-muted-foreground border-border text-[10px]"><Clock className="h-3 w-3 mr-1" />Pausado</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.nome_anuncio ? <span className="font-medium">"{m.nome_anuncio}"</span> : <em>sem nome</em>}
                    {" · "}
                    <span className="font-mono">ID: {m.ad_id}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={m.ativo}
                    onCheckedChange={(v) => updateMapping(m.id, { ativo: v })}
                  />
                  <Button size="icon" variant="ghost" onClick={() => deleteMapping(m.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Histórico de referrals */}
      <Separator />
      <div>
        <h3 className="text-lg font-semibold mb-1">Cliques recentes em anúncios ({referrals.length})</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Últimos 50 leads que chegaram por anúncios do Meta.
        </p>
        <div className="grid gap-2">
          {referrals.slice(0, 20).map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-md border border-border/50 bg-card/50 text-xs">
              {r.thumbnail_url && (
                <img src={r.thumbnail_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.title || "(sem título)"}</p>
                <p className="text-muted-foreground font-mono text-[10px]">ID: {r.ad_id ?? "—"}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {r.imovel_id_resolvido
                  ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">vinculado</Badge>
                  : <Badge variant="outline" className="text-[10px]">sem vínculo</Badge>}
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              {r.source_url && (
                <a href={r.source_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
          {referrals.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground italic">Nenhum lead chegou por anúncio ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
