import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X, Trash2, Droplet, FileText, ShieldCheck } from "lucide-react";
import { applyWatermark } from "@/lib/watermark";
import ResponsavelProprietarioSection from "./ResponsavelProprietarioSection";
import ImovelDocumentosTab from "./ImovelDocumentosTab";
import { calcExclusividade, formatDate } from "@/lib/exclusividade";
import { TIPOS_IMOVEL, FINALIDADES, STATUS_OPTIONS, CARACTERISTICAS } from "./NovoImovelDialog";


interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  imovel: any | null;
  onSaved: () => void;
}

const empty = {
  titulo: "", descricao: "", tipo: "Casa", finalidade: "Venda", status: "Disponível",
  valor: "", valor_condominio: "", valor_iptu: "",
  area_total: "", area_construida: "", area_util: "",
  quartos: "", suites: "", banheiros: "", vagas: "",
  cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
  destaque: false, matricula: "",
  exclusividade_inicio: "", exclusividade_fim: "", exclusividade_observacoes: "",
};



const s = (v: any) => (v == null ? "" : String(v));

function extractStoragePath(url: string): string | null {
  // public URL: .../storage/v1/object/public/imoveis/<path>
  const m = url.match(/\/imoveis\/(.+)$/);
  return m ? m[1] : null;
}

export default function EditarImovelDialog({ open, onOpenChange, imovel, onSaved }: Props) {
  const [form, setForm] = useState({ ...empty });
  const [caracs, setCaracs] = useState<string[]>([]);
  const [fotosExistentes, setFotosExistentes] = useState<string[]>([]);
  const [novasFotos, setNovasFotos] = useState<File[]>([]);
  const [removerPaths, setRemoverPaths] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [reapplying, setReapplying] = useState(false);
  const [corretorId, setCorretorId] = useState<string>("");
  const [proprietarioId, setProprietarioId] = useState<string>("");
  const [captadorId, setCaptadorId] = useState<string>("");
  const [parceiroId, setParceiroId] = useState<string>("");

  useEffect(() => {
    if (!imovel) return;
    setForm({
      titulo: s(imovel.titulo), descricao: s(imovel.descricao),
      tipo: imovel.tipo || "Casa", finalidade: imovel.finalidade || "Venda", status: imovel.status || "Disponível",
      valor: s(imovel.valor), valor_condominio: s(imovel.valor_condominio), valor_iptu: s(imovel.valor_iptu),
      area_total: s(imovel.area_total), area_construida: s(imovel.area_construida), area_util: s(imovel.area_util),
      quartos: s(imovel.quartos), suites: s(imovel.suites), banheiros: s(imovel.banheiros), vagas: s(imovel.vagas),
      cep: s(imovel.cep), endereco: s(imovel.endereco), numero: s(imovel.numero),
      complemento: s(imovel.complemento), bairro: s(imovel.bairro), cidade: s(imovel.cidade), estado: s(imovel.estado),
      destaque: !!imovel.destaque, matricula: s(imovel.matricula),
      exclusividade_inicio: s(imovel.exclusividade_inicio),
      exclusividade_fim: s(imovel.exclusividade_fim),
      exclusividade_observacoes: s(imovel.exclusividade_observacoes),
    });
    setCaracs(Array.isArray(imovel.caracteristicas) ? imovel.caracteristicas : []);
    setFotosExistentes(Array.isArray(imovel.fotos) ? imovel.fotos : []);

    setNovasFotos([]);
    setRemoverPaths([]);
    setCorretorId(imovel.corretor_id || "");
    setProprietarioId(imovel.proprietario_id || "");
    setCaptadorId(imovel.corretor_captador_id || "");
    setParceiroId(imovel.corretor_parceiro_id || "");
  }, [imovel]);


  const upd = (k: keyof typeof empty, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const toggleCarac = (c: string) =>
    setCaracs((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const removerFotoExistente = (url: string) => {
    const path = extractStoragePath(url);
    if (path) setRemoverPaths((p) => [...p, path]);
    setFotosExistentes((p) => p.filter((u) => u !== url));
  };

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    setNovasFotos((p) => [...p, ...Array.from(files)].slice(0, 20));
  };

  const isTerreno = ["Terreno", "Lote em condomínio", "Chácara", "Sítio", "Fazenda"].includes(form.tipo);
  const isComercial = ["Galpão", "Sala comercial", "Loja", "Prédio comercial", "Ponto comercial"].includes(form.tipo);

  const reapplyWatermark = async () => {
    if (!imovel?.id || fotosExistentes.length === 0) return;
    if (!confirm(`Reaplicar marca d'água em ${fotosExistentes.length} foto(s)? As originais no storage serão sobrescritas.`)) return;
    setReapplying(true);
    let ok = 0, fail = 0;
    const novasUrls: string[] = [];
    for (const url of fotosExistentes) {
      try {
        const path = extractStoragePath(url);
        if (!path) { fail++; novasUrls.push(url); continue; }
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const baseName = path.split("/").pop() || "foto.jpg";
        const file = new File([blob], baseName, { type: blob.type || "image/jpeg" });
        const stamped = await applyWatermark(file);
        const { error: upErr } = await supabase.storage.from("imoveis").upload(path, stamped, {
          upsert: true, cacheControl: "3600", contentType: stamped.type,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("imoveis").getPublicUrl(path);
        novasUrls.push(`${pub.publicUrl}?v=${Date.now()}`);
        ok++;
      } catch (e) {
        console.error("reapply watermark falhou", url, e);
        novasUrls.push(url);
        fail++;
      }
    }
    // Atualiza array de fotos pra forçar refresh de cache nos clientes
    await supabase.from("imoveis").update({ fotos: novasUrls }).eq("id", imovel.id);
    setFotosExistentes(novasUrls);
    setReapplying(false);
    if (fail === 0) toast.success(`Marca d'água aplicada em ${ok} foto(s)`);
    else toast.warning(`${ok} ok, ${fail} falharam`);
    onSaved();
  };



  const submit = async () => {
    if (!imovel?.id) return;
    if (!form.titulo.trim()) return toast.error("Título é obrigatório");
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;

      // upload novas fotos com marca d'água
      const novasUrls: string[] = [];
      for (const original of novasFotos) {
        const file = await applyWatermark(original);
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `${userId}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from("imoveis").upload(path, file, {
          cacheControl: "3600", upsert: false, contentType: file.type,
        });
        if (upErr) {
          console.error(upErr);
          toast.error(`Falha ao enviar foto: ${original.name}`);
          continue;
        }
        const { data: pub } = supabase.storage.from("imoveis").getPublicUrl(path);
        novasUrls.push(pub.publicUrl);
      }

      // remover do storage as fotos descartadas
      if (removerPaths.length) {
        await supabase.storage.from("imoveis").remove(removerPaths);
      }

      const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
      const int = (s: string) => (s.trim() === "" ? null : parseInt(s, 10));

      const { error } = await supabase.from("imoveis").update({
        titulo: form.titulo.trim(),
        descricao: form.descricao || null,
        tipo: form.tipo,
        finalidade: form.finalidade,
        status: form.status,
        valor: num(form.valor),
        valor_condominio: num(form.valor_condominio),
        valor_iptu: num(form.valor_iptu),
        area_total: num(form.area_total),
        area_construida: num(form.area_construida),
        area_util: num(form.area_util),
        quartos: int(form.quartos) ?? 0,
        suites: int(form.suites) ?? 0,
        banheiros: int(form.banheiros) ?? 0,
        vagas: int(form.vagas) ?? 0,
        cep: form.cep || null,
        endereco: form.endereco || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        destaque: form.destaque,
        matricula: form.matricula || null,
        caracteristicas: caracs,
        fotos: [...fotosExistentes, ...novasUrls],
        corretor_id: corretorId || null,
        proprietario_id: proprietarioId || null,
        corretor_captador_id: captadorId || null,
        corretor_parceiro_id: parceiroId || null,
        exclusividade_inicio: form.exclusividade_inicio || null,
        exclusividade_fim: form.exclusividade_fim || null,
        exclusividade_observacoes: form.exclusividade_observacoes || null,
      }).eq("id", imovel.id);



      if (error) throw error;
      toast.success("Imóvel atualizado!");
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar imóvel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Editar imóvel
            {imovel?.codigo && (
              <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">
                {imovel.codigo}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>Atualize as informações e fotos do imóvel.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="py-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="documentos"><FileText className="h-4 w-4 mr-1" />Documentos</TabsTrigger>
            <TabsTrigger value="exclusividade"><ShieldCheck className="h-4 w-4 mr-1" />Exclusividade</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-6 pt-4">

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identificação</h3>
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => upd("titulo", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => upd("tipo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS_IMOVEL.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Finalidade *</Label>
                <Select value={form.finalidade} onValueChange={(v) => upd("finalidade", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FINALIDADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => upd("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={3} value={form.descricao} onChange={(e) => upd("descricao", e.target.value)} />
            </div>
            <div>
              <Label>Matrícula (uso interno)</Label>
              <Input value={form.matricula} onChange={(e) => upd("matricula", e.target.value)} placeholder="Nº da matrícula no cartório" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="edit-destaque" checked={form.destaque} onCheckedChange={(v) => upd("destaque", v)} />
              <Label htmlFor="edit-destaque" className="cursor-pointer">Imóvel em destaque</Label>
            </div>
          </section>

          <ResponsavelProprietarioSection
            corretorId={corretorId}
            onCorretorChange={setCorretorId}
            proprietarioId={proprietarioId}
            onProprietarioChange={setProprietarioId}
            captadorId={captadorId}
            onCaptadorChange={setCaptadorId}
            parceiroId={parceiroId}
            onParceiroChange={setParceiroId}
          />


          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Valores</h3>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Valor (R$)</Label><Input type="number" inputMode="decimal" value={form.valor} onChange={(e) => upd("valor", e.target.value)} /></div>
              <div><Label>Condomínio (R$)</Label><Input type="number" inputMode="decimal" value={form.valor_condominio} onChange={(e) => upd("valor_condominio", e.target.value)} /></div>
              <div><Label>IPTU (R$)</Label><Input type="number" inputMode="decimal" value={form.valor_iptu} onChange={(e) => upd("valor_iptu", e.target.value)} /></div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {isTerreno ? "Áreas" : "Áreas e cômodos"}
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div><Label>Área total (m²)</Label><Input type="number" inputMode="decimal" value={form.area_total} onChange={(e) => upd("area_total", e.target.value)} /></div>
              {!isTerreno && <div><Label>Área construída (m²)</Label><Input type="number" inputMode="decimal" value={form.area_construida} onChange={(e) => upd("area_construida", e.target.value)} /></div>}
              {!isTerreno && <div><Label>Área útil (m²)</Label><Input type="number" inputMode="decimal" value={form.area_util} onChange={(e) => upd("area_util", e.target.value)} /></div>}
              <div><Label>Vagas garagem</Label><Input type="number" value={form.vagas} onChange={(e) => upd("vagas", e.target.value)} /></div>
            </div>
            {!isTerreno && !isComercial && (
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Quartos</Label><Input type="number" value={form.quartos} onChange={(e) => upd("quartos", e.target.value)} /></div>
                <div><Label>Suítes</Label><Input type="number" value={form.suites} onChange={(e) => upd("suites", e.target.value)} /></div>
                <div><Label>Banheiros</Label><Input type="number" value={form.banheiros} onChange={(e) => upd("banheiros", e.target.value)} /></div>
              </div>
            )}
            {isComercial && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Banheiros</Label><Input type="number" value={form.banheiros} onChange={(e) => upd("banheiros", e.target.value)} /></div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Localização</h3>
            <div className="grid grid-cols-4 gap-3">
              <div><Label>CEP</Label><Input value={form.cep} onChange={(e) => upd("cep", e.target.value)} /></div>
              <div className="col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={(e) => upd("endereco", e.target.value)} /></div>
              <div><Label>Número</Label><Input value={form.numero} onChange={(e) => upd("numero", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div><Label>Complemento</Label><Input value={form.complemento} onChange={(e) => upd("complemento", e.target.value)} /></div>
              <div><Label>Bairro</Label><Input value={form.bairro} onChange={(e) => upd("bairro", e.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => upd("cidade", e.target.value)} /></div>
              <div><Label>UF</Label><Input maxLength={2} value={form.estado} onChange={(e) => upd("estado", e.target.value.toUpperCase())} /></div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Características</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CARACTERISTICAS.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={caracs.includes(c)} onCheckedChange={() => toggleCarac(c)} />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Fotos</h3>
            {fotosExistentes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Fotos atuais</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={reapplyWatermark}
                    disabled={reapplying || saving}
                    className="h-7 text-xs"
                  >
                    {reapplying ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Droplet className="h-3 w-3 mr-1" />}
                    Reaplicar marca d'água
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {fotosExistentes.map((url) => (
                    <div key={url} className="relative group">
                      <img src={url} alt="" className="w-full h-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removerFotoExistente(url)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        title="Remover foto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Adicionar novas fotos</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>

            {novasFotos.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Novas fotos (serão enviadas com marca d'água)</p>
                <div className="grid grid-cols-4 gap-2">
                  {novasFotos.map((f, i) => (
                    <div key={i} className="relative group">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => setNovasFotos((p) => p.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-background/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando…</>) : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
