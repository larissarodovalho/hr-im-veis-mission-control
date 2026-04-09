import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Trash2, Eye, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Lead } from "@/data/mockData";

interface Imovel {
  id: string;
  nome: string;
  [key: string]: unknown;
}

interface Proposta {
  id: string;
  clienteId: string;
  clienteNome: string;
  imovelId: string;
  imovelNome: string;
  arquivo?: { nome: string; url: string; tipo: string };
  dataCriacao: string;
  status: "Pendente" | "Aceita" | "Recusada";
}

interface PropostasTabProps {
  leads: Lead[];
  imoveis: Imovel[];
}

export default function PropostasTab({ leads, imoveis }: PropostasTabProps) {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [clienteSel, setClienteSel] = useState("");
  const [imovelSel, setImovelSel] = useState("");
  const [arquivo, setArquivo] = useState<{ nome: string; url: string; tipo: string } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ nome: string; url: string; tipo: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setArquivo({ nome: file.name, url: ev.target?.result as string, tipo: file.type });
    };
    reader.readAsDataURL(file);
  };

  const salvarProposta = () => {
    if (!clienteSel || !imovelSel) {
      toast.error("Selecione o cliente e o imóvel.");
      return;
    }
    const lead = leads.find(l => l.id === clienteSel);
    const imovel = imoveis.find(i => String(i.id) === imovelSel);
    if (!lead || !imovel) return;

    const nova: Proposta = {
      id: `prop-${Date.now()}`,
      clienteId: lead.id,
      clienteNome: lead.nome,
      imovelId: imovel.id,
      imovelTitulo: imovel.titulo,
      arquivo: arquivo || undefined,
      dataCriacao: new Date().toISOString().slice(0, 10),
      status: "Pendente",
    };
    setPropostas(prev => [nova, ...prev]);
    setClienteSel("");
    setImovelSel("");
    setArquivo(null);
    setDialogAberto(false);
    toast.success("Proposta cadastrada com sucesso!");
  };

  return (
    <>
      {/* Preview doc */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> {previewDoc?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full h-[60vh] rounded-md overflow-hidden border bg-muted/20">
            {previewDoc && (previewDoc.tipo.startsWith("image/") ? (
              <img src={previewDoc.url} alt={previewDoc.nome} className="w-full h-full object-contain" />
            ) : (
              <iframe src={previewDoc.url} className="w-full h-full" title={previewDoc.nome} />
            ))}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" asChild>
              <a href={previewDoc?.url} download={previewDoc?.nome}><Download className="h-3.5 w-3.5 mr-1.5" /> Baixar</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Propostas</CardTitle>
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs"><Plus className="h-3.5 w-3.5 mr-1" /> Nova Proposta</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Proposta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cliente (Lead)</Label>
                  <Select value={clienteSel} onValueChange={setClienteSel}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      {leads.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Imóvel</Label>
                  <Select value={imovelSel} onValueChange={setImovelSel}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione o imóvel" /></SelectTrigger>
                    <SelectContent>
                      {imoveis.map(i => (
                        <SelectItem key={i.id} value={String(i.id)}>{i.titulo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Arquivo da Proposta</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="h-8 text-sm"
                  />
                  {arquivo && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="truncate flex-1">{arquivo.nome}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setArquivo(null)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setDialogAberto(false)}>Cancelar</Button>
                <Button size="sm" onClick={salvarProposta}>Cadastrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {propostas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhuma proposta cadastrada ainda.</p>
              <p className="text-xs mt-1">Clique em "Nova Proposta" para começar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Cliente</th>
                    <th className="text-left p-3 font-medium">Imóvel</th>
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Arquivo</th>
                    <th className="text-left p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {propostas.map(p => (
                    <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">{p.clienteNome}</td>
                      <td className="p-3 text-xs">{p.imovelTitulo}</td>
                      <td className="p-3 text-xs">{p.dataCriacao}</td>
                      <td className="p-3">
                        <Badge variant={p.status === "Aceita" ? "default" : p.status === "Recusada" ? "destructive" : "outline"} className="text-[10px]">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {p.arquivo ? (
                          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setPreviewDoc(p.arquivo!)}>
                            <Eye className="h-3 w-3" /> Ver
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-6 text-[10px]"
                            onClick={() => { setPropostas(prev => prev.map(x => x.id === p.id ? { ...x, status: "Aceita" } : x)); toast.success("Proposta aceita!"); }}
                            disabled={p.status !== "Pendente"}>Aceitar</Button>
                          <Button variant="outline" size="sm" className="h-6 text-[10px] text-destructive"
                            onClick={() => { setPropostas(prev => prev.map(x => x.id === p.id ? { ...x, status: "Recusada" } : x)); toast.info("Proposta recusada."); }}
                            disabled={p.status !== "Pendente"}>Recusar</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
