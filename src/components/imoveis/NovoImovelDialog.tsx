import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export const TIPOS_IMOVEL = [
  "Casa",
  "Sobrado",
  "Apartamento",
  "Cobertura",
  "Kitnet/Studio",
  "Loft",
  "Terreno",
  "Lote em condomínio",
  "Chácara",
  "Sítio",
  "Fazenda",
  "Galpão",
  "Sala comercial",
  "Loja",
  "Prédio comercial",
  "Ponto comercial",
] as const;

export const FINALIDADES = ["Venda", "Locação", "Venda e Locação", "Temporada"] as const;

export const STATUS_OPTIONS = [
  "Disponível",
  "Reservado",
  "Vendido",
  "Alugado",
  "Em construção",
  "Indisponível",
] as const;

export const CARACTERISTICAS = [
  "Piscina",
  "Churrasqueira",
  "Área gourmet",
  "Academia",
  "Salão de festas",
  "Playground",
  "Quadra esportiva",
  "Portaria 24h",
  "Elevador",
  "Mobiliado",
  "Semi-mobiliado",
  "Ar-condicionado",
  "Aquecimento solar",
  "Energia solar",
  "Jardim",
  "Quintal",
  "Varanda",
  "Sacada",
  "Lavabo",
  "Escritório",
  "Closet",
  "Despensa",
  "Lareira",
  "Sauna",
  "Hidromassagem",
  "Garagem coberta",
  "Próximo ao centro",
  "Próximo a escolas",
  "Aceita financiamento",
  "Aceita FGTS",
  "Aceita permuta",
  "Documentação ok",
] as const;

const empty = {
  titulo: "",
  descricao: "",
  tipo: "Casa" as string,
  finalidade: "Venda" as string,
  status: "Disponível" as string,
  valor: "",
  valor_condominio: "",
  valor_iptu: "",
  area_total: "",
  area_util: "",
  quartos: "",
  suites: "",
  banheiros: "",
  vagas: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  destaque: false,
};

export default function NovoImovelDialog({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState({ ...empty });
  const [caracs, setCaracs] = useState<string[]>([]);
  const [fotos, setFotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const upd = (k: keyof typeof empty, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const toggleCarac = (c: string) =>
    setCaracs((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    setFotos((p) => [...p, ...Array.from(files)].slice(0, 20));
  };

  const removeFoto = (i: number) => setFotos((p) => p.filter((_, idx) => idx !== i));

  const reset = () => {
    setForm({ ...empty });
    setCaracs([]);
    setFotos([]);
  };

  const isTerreno = ["Terreno", "Lote em condomínio", "Chácara", "Sítio", "Fazenda"].includes(form.tipo);
  const isComercial = ["Galpão", "Sala comercial", "Loja", "Prédio comercial", "Ponto comercial"].includes(form.tipo);

  const submit = async () => {
    if (!form.titulo.trim()) return toast.error("Título é obrigatório");
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;

      // Upload das fotos no bucket "imoveis"
      const urls: string[] = [];
      for (const file of fotos) {
        const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("imoveis").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) {
          console.error(upErr);
          toast.error(`Falha ao enviar foto: ${file.name}`);
          continue;
        }
        const { data: pub } = supabase.storage.from("imoveis").getPublicUrl(path);
        urls.push(pub.publicUrl);
      }

      const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
      const int = (s: string) => (s.trim() === "" ? null : parseInt(s, 10));

      const { error } = await supabase.from("imoveis").insert({
        titulo: form.titulo.trim(),
        descricao: form.descricao || null,
        tipo: form.tipo,
        finalidade: form.finalidade,
        status: form.status,
        valor: num(form.valor),
        valor_condominio: num(form.valor_condominio),
        valor_iptu: num(form.valor_iptu),
        area_total: num(form.area_total),
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
        caracteristicas: caracs,
        fotos: urls,
        created_by: userId,
        corretor_id: userId,
      });

      if (error) throw error;
      toast.success("Imóvel cadastrado!");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar imóvel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar imóvel</DialogTitle>
          <DialogDescription>Preencha as informações do imóvel.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Identificação */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identificação</h3>
            <div>
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => upd("titulo", e.target.value)} placeholder="Ex.: Casa 3 quartos no Jardim Goiás" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => upd("tipo", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_IMOVEL.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Finalidade *</Label>
                <Select value={form.finalidade} onValueChange={(v) => upd("finalidade", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FINALIDADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => upd("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={3} value={form.descricao} onChange={(e) => upd("descricao", e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="destaque" checked={form.destaque} onCheckedChange={(v) => upd("destaque", v)} />
              <Label htmlFor="destaque" className="cursor-pointer">Imóvel em destaque</Label>
            </div>
          </section>

          {/* Valores */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Valores</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <Input type="number" inputMode="decimal" value={form.valor} onChange={(e) => upd("valor", e.target.value)} />
              </div>
              <div>
                <Label>Condomínio (R$)</Label>
                <Input type="number" inputMode="decimal" value={form.valor_condominio} onChange={(e) => upd("valor_condominio", e.target.value)} />
              </div>
              <div>
                <Label>IPTU (R$)</Label>
                <Input type="number" inputMode="decimal" value={form.valor_iptu} onChange={(e) => upd("valor_iptu", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Áreas e cômodos */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {isTerreno ? "Áreas" : "Áreas e cômodos"}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Área total (m²)</Label>
                <Input type="number" inputMode="decimal" value={form.area_total} onChange={(e) => upd("area_total", e.target.value)} />
              </div>
              {!isTerreno && (
                <div>
                  <Label>Área útil (m²)</Label>
                  <Input type="number" inputMode="decimal" value={form.area_util} onChange={(e) => upd("area_util", e.target.value)} />
                </div>
              )}
              <div>
                <Label>Vagas garagem</Label>
                <Input type="number" value={form.vagas} onChange={(e) => upd("vagas", e.target.value)} />
              </div>
            </div>
            {!isTerreno && !isComercial && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Quartos</Label>
                  <Input type="number" value={form.quartos} onChange={(e) => upd("quartos", e.target.value)} />
                </div>
                <div>
                  <Label>Suítes</Label>
                  <Input type="number" value={form.suites} onChange={(e) => upd("suites", e.target.value)} />
                </div>
                <div>
                  <Label>Banheiros</Label>
                  <Input type="number" value={form.banheiros} onChange={(e) => upd("banheiros", e.target.value)} />
                </div>
              </div>
            )}
            {isComercial && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Banheiros</Label>
                  <Input type="number" value={form.banheiros} onChange={(e) => upd("banheiros", e.target.value)} />
                </div>
              </div>
            )}
          </section>

          {/* Localização */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Localização</h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label>CEP</Label>
                <Input value={form.cep} onChange={(e) => upd("cep", e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={(e) => upd("endereco", e.target.value)} />
              </div>
              <div>
                <Label>Número</Label>
                <Input value={form.numero} onChange={(e) => upd("numero", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label>Complemento</Label>
                <Input value={form.complemento} onChange={(e) => upd("complemento", e.target.value)} />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input value={form.bairro} onChange={(e) => upd("bairro", e.target.value)} />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={(e) => upd("cidade", e.target.value)} />
              </div>
              <div>
                <Label>UF</Label>
                <Input maxLength={2} value={form.estado} onChange={(e) => upd("estado", e.target.value.toUpperCase())} />
              </div>
            </div>
          </section>

          {/* Características */}
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

          {/* Fotos */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Fotos</h3>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clique para adicionar fotos (até 20)</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>
            {fotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {fotos.map((f, i) => (
                  <div key={i} className="relative group">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-20 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeFoto(i)}
                      className="absolute top-1 right-1 bg-background/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando…</>) : "Cadastrar imóvel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
