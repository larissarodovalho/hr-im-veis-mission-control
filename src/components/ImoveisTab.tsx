import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IMOVEIS_CRM, type ImovelCRM } from "@/data/imoveisCRM";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, MapPin, User, Phone, FileText, Image, Plus, ChevronDown, ChevronUp, Trash2, Search, Upload } from "lucide-react";
import { toast } from "sonner";

export type Imovel = ImovelCRM;
const CORRETORES = ["Hans", "Rafael", "Gabriel"] as const;

const emptyImovel = {
  nome: "", tipo: "Casa" as Imovel["tipo"], valor: "", status: "Disponível" as Imovel["status"],
  corretor: "Hans" as Imovel["corretor"], descricao: "", area: "", quartos: "0", banheiros: "0", vagas: "0",
  rua: "", numero: "", bairro: "", condominio: "", cidade: "Sinop", estado: "MT",
  propNome: "", propTelefone: "", propEmail: "", propCpfCnpj: "",
  fotos: [] as string[],
  documentos: [] as { nome: string; arquivo: string }[],
};

const statusColor = (s: Imovel["status"]) => {
  if (s === "Disponível") return "bg-green-500 text-white";
  if (s === "Indisponível") return "bg-red-500 text-white";
  if (s === "Em negociação") return "bg-amber-500 text-white";
  return "bg-primary text-primary-foreground";
};

export default function ImoveisTab() {
  const [imoveisList, setImoveisList] = useState<Imovel[]>(IMOVEIS_CRM);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"Todos" | Imovel["status"]>("Todos");
  const [filtroCorretor, setFiltroCorretor] = useState<"Todos" | Imovel["corretor"]>("Todos");
  const [apenasExclusivos, setApenasExclusivos] = useState(false);
  const [form, setForm] = useState({ ...emptyImovel });
  const [novoDoc, setNovoDoc] = useState({ imovelId: "", nome: "" });

  const addImovel = () => {
    const nome = form.nome.trim();
    if (!nome) { toast.error("Preencha o nome do imóvel."); return; }
    if (!form.valor || Number(form.valor) <= 0) { toast.error("Informe o valor do imóvel."); return; }
    if (!form.propNome.trim()) { toast.error("Preencha o nome do proprietário."); return; }

    const novo: Imovel = {
      id: `im-${Date.now()}`,
      codigo: `HR${String(Math.floor(Math.random() * 9000) + 1000)}`,
      nome,
      tipo: form.tipo,
      valor: Number(form.valor),
      status: form.status,
      corretor: form.corretor,
      descricao: form.descricao.trim(),
      area: form.area.trim(),
      quartos: Number(form.quartos) || 0,
      banheiros: Number(form.banheiros) || 0,
      vagas: Number(form.vagas) || 0,
      endereco: {
        rua: form.rua.trim(), numero: form.numero.trim(), bairro: form.bairro.trim(),
        condominio: form.condominio.trim(), cidade: form.cidade.trim(), estado: form.estado.trim(),
      },
      proprietario: {
        nome: form.propNome.trim(), telefone: form.propTelefone.trim(),
        email: form.propEmail.trim(), cpfCnpj: form.propCpfCnpj.trim(),
      },
      fotos: [...form.fotos],
      documentos: form.documentos.map(d => ({ nome: d.nome, tipo: d.nome.split('.').pop()?.toUpperCase() || "PDF", dataUpload: new Date().toISOString().slice(0, 10) })),
    };
    setImoveisList(prev => [novo, ...prev]);
    setForm({ ...emptyImovel });
    setDialogAberto(false);
    toast.success(`Imóvel "${nome}" cadastrado!`);
  };

  const addDocumento = (imovelId: string, docNome: string) => {
    if (!docNome.trim()) return;
    setImoveisList(prev => prev.map(im =>
      im.id === imovelId
        ? { ...im, documentos: [...im.documentos, { nome: docNome.trim(), tipo: "PDF", dataUpload: new Date().toISOString().slice(0, 10) }] }
        : im
    ));
    setNovoDoc({ imovelId: "", nome: "" });
    toast.success("Documento anexado!");
  };

  const removeDocumento = (imovelId: string, idx: number) => {
    setImoveisList(prev => prev.map(im =>
      im.id === imovelId
        ? { ...im, documentos: im.documentos.filter((_, i) => i !== idx) }
        : im
    ));
  };

  const filtered = imoveisList
    .filter(im => filtroStatus === "Todos" || im.status === filtroStatus)
    .filter(im => filtroCorretor === "Todos" || im.corretor === filtroCorretor)
    .filter(im => !apenasExclusivos || im.codigo.startsWith("HR"))
    .filter(im => !busca || im.nome.toLowerCase().includes(busca.toLowerCase()) || im.codigo.toLowerCase().includes(busca.toLowerCase()) || im.endereco.bairro.toLowerCase().includes(busca.toLowerCase()));

  const totalDisp = imoveisList.filter(i => i.status === "Disponível").length;
  const totalNeg = imoveisList.filter(i => i.status === "Em negociação").length;
  const totalVend = imoveisList.filter(i => i.status === "Vendido").length;
  const totalInd = imoveisList.filter(i => i.status === "Indisponível").length;

  const statusCards: { label: string; value: "Todos" | Imovel["status"]; count: number; color: string }[] = [
    { label: "Total", value: "Todos", count: imoveisList.length, color: "border-primary/50 hover:border-primary" },
    { label: "Disponíveis", value: "Disponível", count: totalDisp, color: "border-green-500/50 hover:border-green-500" },
    { label: "Em Negociação", value: "Em negociação", count: totalNeg, color: "border-amber-500/50 hover:border-amber-500" },
    { label: "Vendidos", value: "Vendido", count: totalVend, color: "border-primary/50 hover:border-primary" },
    { label: "Indisponíveis", value: "Indisponível", count: totalInd, color: "border-red-500/50 hover:border-red-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statusCards.map(sc => (
          <button
            key={sc.label}
            onClick={() => setFiltroStatus(sc.value)}
            className={`rounded-lg border-2 p-3 text-left transition-all cursor-pointer ${sc.color} ${filtroStatus === sc.value ? "ring-2 ring-primary bg-muted/60" : "bg-card hover:bg-muted/30"}`}
          >
            <p className="text-xs text-muted-foreground">{sc.label}</p>
            <p className="text-2xl font-bold">{sc.count}</p>
          </button>
        ))}
      </div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="h-8 text-xs pl-8" placeholder="Buscar por referência ou bairro..." value={busca} onChange={e => setBusca(e.target.value)} maxLength={50} />
          </div>
          <Select value={filtroStatus} onValueChange={v => setFiltroStatus(v as typeof filtroStatus)}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              {["Todos", "Disponível", "Indisponível", "Em negociação", "Vendido"].map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroCorretor} onValueChange={v => setFiltroCorretor(v as typeof filtroCorretor)}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Corretor" /></SelectTrigger>
            <SelectContent>
              {["Todos", ...CORRETORES].map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <button
            onClick={() => setApenasExclusivos(!apenasExclusivos)}
            className={`h-8 px-3 text-xs rounded-md border transition-all font-medium ${apenasExclusivos ? "bg-primary text-primary-foreground border-primary" : "bg-card border-input hover:bg-muted/50"}`}
          >
            Exclusivos HR
          </button>
        </div>
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs gap-1"><Plus className="h-3.5 w-3.5" /> Captar Imóvel</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Imóvel</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="dados" className="mt-2">
              <TabsList className="h-8 bg-muted/50 rounded-md p-0.5 gap-0.5 w-full">
                <TabsTrigger value="dados" className="h-7 text-xs flex-1">Dados do Imóvel</TabsTrigger>
                <TabsTrigger value="endereco" className="h-7 text-xs flex-1">Endereço</TabsTrigger>
                <TabsTrigger value="proprietario" className="h-7 text-xs flex-1">Proprietário</TabsTrigger>
                <TabsTrigger value="fotos" className="h-7 text-xs flex-1">Fotos</TabsTrigger>
                <TabsTrigger value="documentos" className="h-7 text-xs flex-1">Documentos</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Nome do Imóvel *</Label>
                    <Input className="h-8 text-sm" placeholder="Ex: Casa Condomínio Lago Azul" maxLength={120} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo</Label>
                    <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as Imovel["tipo"] }))}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Casa", "Terreno", "Apartamento", "Sobrado", "Cobertura"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Valor (R$) *</Label>
                    <Input type="number" className="h-8 text-sm" placeholder="1500000" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as Imovel["status"] }))}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Disponível", "Indisponível", "Em negociação", "Vendido"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Corretor Responsável</Label>
                    <Select value={form.corretor} onValueChange={v => setForm(p => ({ ...p, corretor: v as Imovel["corretor"] }))}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CORRETORES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Área</Label>
                    <Input className="h-8 text-sm" placeholder="350m²" maxLength={20} value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quartos</Label>
                    <Input type="number" className="h-8 text-sm" min={0} value={form.quartos} onChange={e => setForm(p => ({ ...p, quartos: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Banheiros</Label>
                    <Input type="number" className="h-8 text-sm" min={0} value={form.banheiros} onChange={e => setForm(p => ({ ...p, banheiros: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vagas</Label>
                    <Input type="number" className="h-8 text-sm" min={0} value={form.vagas} onChange={e => setForm(p => ({ ...p, vagas: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Descrição</Label>
                    <Textarea className="text-sm min-h-[80px]" placeholder="Descreva o imóvel..." maxLength={1000} value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="endereco" className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Condomínio</Label>
                    <Input className="h-8 text-sm" placeholder="Ex: Aquarela das Artes" maxLength={100} value={form.condominio} onChange={e => setForm(p => ({ ...p, condominio: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Rua</Label>
                    <Input className="h-8 text-sm" placeholder="Rua Principal" maxLength={100} value={form.rua} onChange={e => setForm(p => ({ ...p, rua: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Número</Label>
                    <Input className="h-8 text-sm" placeholder="123" maxLength={10} value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Bairro</Label>
                    <Input className="h-8 text-sm" placeholder="Centro" maxLength={50} value={form.bairro} onChange={e => setForm(p => ({ ...p, bairro: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cidade</Label>
                    <Input className="h-8 text-sm" value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} maxLength={50} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Estado</Label>
                    <Input className="h-8 text-sm" value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} maxLength={2} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="proprietario" className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Nome do Proprietário *</Label>
                    <Input className="h-8 text-sm" placeholder="Nome completo" maxLength={100} value={form.propNome} onChange={e => setForm(p => ({ ...p, propNome: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Telefone</Label>
                    <Input className="h-8 text-sm" placeholder="(66) 99999-0000" maxLength={20} value={form.propTelefone} onChange={e => setForm(p => ({ ...p, propTelefone: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">E-mail</Label>
                    <Input type="email" className="h-8 text-sm" placeholder="email@exemplo.com" maxLength={100} value={form.propEmail} onChange={e => setForm(p => ({ ...p, propEmail: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">CPF/CNPJ</Label>
                    <Input className="h-8 text-sm" placeholder="000.000.000-00" maxLength={18} value={form.propCpfCnpj} onChange={e => setForm(p => ({ ...p, propCpfCnpj: e.target.value }))} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fotos" className="space-y-3 mt-3">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Adicionar Fotos do Imóvel</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="h-auto text-sm file:mr-3 file:h-8 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:font-medium hover:file:bg-primary/90 cursor-pointer"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        Array.from(files).forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const result = ev.target?.result as string;
                            if (result) {
                              setForm(p => ({ ...p, fotos: [...p.fotos, result] }));
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = "";
                      }}
                    />
                  </div>
                  {form.fotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {form.fotos.map((foto, idx) => (
                        <div key={idx} className="relative group rounded-md overflow-hidden border border-border">
                          <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-24 object-cover" />
                          <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, fotos: p.fotos.filter((_, i) => i !== idx) }))}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.fotos.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
                      <Image className="h-10 w-10 mb-2 opacity-40" />
                      <p className="text-sm">Nenhuma foto adicionada</p>
                      <p className="text-xs">Clique acima para selecionar fotos</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documentos" className="space-y-3 mt-3">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Adicionar Documentos do Imóvel</Label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      multiple
                      className="h-auto text-sm file:mr-3 file:h-8 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:font-medium hover:file:bg-primary/90 cursor-pointer"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        Array.from(files).forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const result = ev.target?.result as string;
                            if (result) {
                              setForm(p => ({
                                ...p,
                                documentos: [...p.documentos, { nome: file.name, arquivo: result }]
                              }));
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = "";
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground">Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
                  </div>
                  {form.documentos.length > 0 && (
                    <div className="space-y-1.5">
                      {form.documentos.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-muted/40 rounded-md px-3 py-2 group">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-xs truncate max-w-[200px]">{doc.nome}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, documentos: p.documentos.filter((_, i) => i !== idx) }))}
                            className="h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.documentos.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
                      <Upload className="h-10 w-10 mb-2 opacity-40" />
                      <p className="text-sm">Nenhum documento adicionado</p>
                      <p className="text-xs">Clique acima para selecionar documentos</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setDialogAberto(false)}>Cancelar</Button>
              <Button size="sm" onClick={addImovel}>Cadastrar Imóvel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { label: "Total", value: imoveisList.length, color: "text-foreground" },
          { label: "Disponíveis", value: imoveisList.filter(i => i.status === "Disponível").length, color: "text-green-500" },
          { label: "Em Negociação", value: imoveisList.filter(i => i.status === "Em negociação").length, color: "text-amber-500" },
          { label: "Vendidos", value: imoveisList.filter(i => i.status === "Vendido").length, color: "text-primary" },
        ] as const).map(k => (
          <div key={k.label} className="stat-card">
            <span className="text-xs text-muted-foreground">{k.label}</span>
            <p className={`text-2xl font-bold font-display ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(im => (
          <Card key={im.id} className="overflow-hidden hover:shadow-md transition-shadow">
            {/* Foto ou placeholder */}
            <div className="relative h-40 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
              {im.fotos.length > 0 ? (
                <img src={im.fotos[0]} alt={im.nome} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="h-12 w-12 text-muted-foreground/30" />
              )}
              <Badge className={`absolute bottom-3 right-3 text-[10px] ${statusColor(im.status)}`}>{im.status}</Badge>
            </div>
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-start gap-1">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs font-semibold leading-tight line-clamp-2">{im.nome}</p>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">{im.codigo}</p>
              <p className="text-sm font-bold text-primary">R$ {im.valor.toLocaleString("pt-BR")}</p>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{im.corretor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{im.tipo} · {im.area}</span>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2"
                  onClick={() => setExpandedId(expandedId === im.id ? null : im.id)}>
                  Detalhes {expandedId === im.id ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
              </div>
            </CardContent>

            {/* Expanded Details */}
            {expandedId === im.id && (
              <div className="border-t p-3 space-y-3 bg-muted/10">
                <Tabs defaultValue="info">
                  <TabsList className="h-7 bg-muted/50 rounded-md p-0.5 gap-0.5 w-full">
                    <TabsTrigger value="info" className="h-6 text-[10px] flex-1">Info</TabsTrigger>
                    <TabsTrigger value="proprietario" className="h-6 text-[10px] flex-1">Proprietário</TabsTrigger>
                    <TabsTrigger value="endereco" className="h-6 text-[10px] flex-1">Endereço</TabsTrigger>
                    <TabsTrigger value="docs" className="h-6 text-[10px] flex-1">Documentos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="mt-2 space-y-2">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{im.descricao || "Sem descrição."}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/40 rounded p-1.5">
                        <p className="text-xs font-bold">{im.quartos}</p>
                        <p className="text-[9px] text-muted-foreground">Quartos</p>
                      </div>
                      <div className="bg-muted/40 rounded p-1.5">
                        <p className="text-xs font-bold">{im.banheiros}</p>
                        <p className="text-[9px] text-muted-foreground">Banheiros</p>
                      </div>
                      <div className="bg-muted/40 rounded p-1.5">
                        <p className="text-xs font-bold">{im.vagas}</p>
                        <p className="text-[9px] text-muted-foreground">Vagas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <User className="h-3 w-3" /> Corretor: <span className="font-semibold text-foreground">{im.corretor}</span>
                    </div>
                  </TabsContent>

                  <TabsContent value="proprietario" className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold">{im.proprietario.nome}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Phone className="h-3 w-3" /> {im.proprietario.telefone || "—"}
                    </div>
                    <p className="text-[11px] text-muted-foreground">📧 {im.proprietario.email || "—"}</p>
                    <p className="text-[11px] text-muted-foreground">📋 CPF/CNPJ: {im.proprietario.cpfCnpj || "—"}</p>
                  </TabsContent>

                  <TabsContent value="endereco" className="mt-2 space-y-1">
                    <div className="flex items-start gap-1.5 text-[11px]">
                      <MapPin className="h-3.5 w-3.5 text-primary mt-0.5" />
                      <div>
                        {im.endereco.condominio && <p className="font-semibold">{im.endereco.condominio}</p>}
                        <p>{im.endereco.rua}{im.endereco.numero ? `, ${im.endereco.numero}` : ""}</p>
                        <p>{im.endereco.bairro} — {im.endereco.cidade}/{im.endereco.estado}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="docs" className="mt-2 space-y-2">
                    {im.documentos.length > 0 ? (
                      <div className="space-y-1.5">
                        {im.documentos.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-muted/40 rounded px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-primary" />
                              <span className="text-[11px] font-medium">{doc.nome}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-muted-foreground">{doc.dataUpload}</span>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => removeDocumento(im.id, idx)}>
                                <Trash2 className="h-3 w-3 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground text-center py-2">Nenhum documento anexado.</p>
                    )}
                    <div className="flex gap-1.5">
                      <Input className="h-7 text-[11px] flex-1" placeholder="Nome do documento..." maxLength={80}
                        value={novoDoc.imovelId === im.id ? novoDoc.nome : ""}
                        onChange={e => setNovoDoc({ imovelId: im.id, nome: e.target.value })} />
                      <Button size="sm" variant="outline" className="h-7 text-[10px] px-2"
                        onClick={() => addDocumento(im.id, novoDoc.imovelId === im.id ? novoDoc.nome : "")}>
                        <Plus className="h-3 w-3" /> Anexar
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">Nenhum imóvel encontrado.</p>
      )}
    </div>
  );
}
