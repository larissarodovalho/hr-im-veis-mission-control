import { useEffect, useState } from "react";
import { imagemOtimizada, IMG_THUMB } from "@/lib/imagemOtimizada";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, FileDown, Loader2, Presentation } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { gerarPdfApresentacao } from "@/lib/imovelPdf";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  imovel: { id: string; titulo: string; fotos?: string[] | null; descricao?: string | null } | null;
  onSaved?: () => void;
}

export default function ApresentacaoImovelDialog({ open, onOpenChange, imovel, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [video, setVideo] = useState("");
  const [condicoes, setCondicoes] = useState("");
  const [exibirValor, setExibirValor] = useState(true);
  const [localizacao, setLocalizacao] = useState<"bairro_cidade" | "cidade" | "oculto">("bairro_cidade");
  const [fotosPublicas, setFotosPublicas] = useState<string[]>([]);

  const fotos = imovel?.fotos ?? [];

  useEffect(() => {
    if (!open || !imovel) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("imovel_apresentacao_config")
        .select("*")
        .eq("imovel_id", imovel.id)
        .maybeSingle();
      const cfg: any = data ?? {};
      setDescricao(cfg.descricao_publica ?? "");
      setVideo(cfg.video_url ?? "");
      setCondicoes(cfg.condicoes_comerciais_publicas ?? "");
      setExibirValor(cfg.exibir_valor_padrao ?? true);
      setLocalizacao((cfg.localizacao_padrao as any) ?? "bairro_cidade");
      setFotosPublicas(cfg.fotos_publicas?.length ? cfg.fotos_publicas : (imovel.fotos ?? []));
      setLoading(false);
    })();
  }, [open, imovel?.id]);

  const toggleFoto = (url: string) => {
    setFotosPublicas((prev) => (prev.includes(url) ? prev.filter((f) => f !== url) : [...prev, url]));
  };

  const salvar = async () => {
    if (!imovel) return;
    if (fotos.length && !fotosPublicas.length) {
      toast.error("Selecione ao menos uma foto para o link do cliente");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("imovel_apresentacao_config").upsert(
        {
          imovel_id: imovel.id,
          descricao_publica: descricao.trim() || null,
          video_url: video.trim() || null,
          condicoes_comerciais_publicas: condicoes.trim() || null,
          exibir_valor_padrao: exibirValor,
          localizacao_padrao: localizacao,
          fotos_publicas: fotosPublicas,
          updated_by: auth.user?.id ?? null,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "imovel_id" },
      );
      if (error) throw error;
      toast.success("Apresentação salva");
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar a apresentação");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Presentation className="h-4 w-4" /> Apresentação para o cliente
          </DialogTitle>
          <DialogDescription>
            Define o que aparece nos links temporários de {imovel?.titulo}. Nada aqui altera o cadastro interno.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Fotos exibidas ({fotosPublicas.length}/{fotos.length})</Label>
              {fotos.length ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {fotos.map((url) => {
                    const on = fotosPublicas.includes(url);
                    return (
                      <button
                        key={url}
                        type="button"
                        onClick={() => toggleFoto(url)}
                        className={`relative rounded-md overflow-hidden border-2 transition ${on ? "border-primary" : "border-transparent opacity-50"}`}
                      >
                        <img src={imagemOtimizada(url, IMG_THUMB)} alt="" loading="lazy" decoding="async" className="h-20 w-full object-cover" />
                        {on && (
                          <span className="absolute top-1 right-1 rounded-full bg-primary text-primary-foreground p-0.5">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Este imóvel ainda não tem fotos cadastradas.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc-pub">Descrição pública</Label>
              <Textarea
                id="desc-pub"
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder={imovel?.descricao ? "Vazio usa a descrição do cadastro" : "Texto que o cliente vai ler"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cond-pub">Condições comerciais</Label>
              <Textarea
                id="cond-pub"
                rows={3}
                value={condicoes}
                onChange={(e) => setCondicoes(e.target.value)}
                placeholder="Ex.: aceita financiamento, entrada a partir de 20%, permuta parcial"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="video-pub">Vídeo / tour virtual (URL)</Label>
                <Input id="video-pub" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Localização exibida</Label>
                <Select value={localizacao} onValueChange={(v) => setLocalizacao(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bairro_cidade">Bairro e cidade</SelectItem>
                    <SelectItem value="cidade">Somente cidade</SelectItem>
                    <SelectItem value="oculto">Não exibir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-sm">Exibir valor por padrão</Label>
                <p className="text-xs text-muted-foreground">Pode ser ajustado na criação de cada link.</p>
              </div>
              <Switch checked={exibirValor} onCheckedChange={setExibirValor} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="secondary" onClick={gerarPdf} disabled={gerando || saving || loading}>
            {gerando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            Gerar PDF
          </Button>
          <Button onClick={salvar} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar apresentação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
