import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Phone, ClipboardList, Calendar, Building2, FileText, Plus, Check, User, Clock, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { imoveis, type Lead, type LeadEtapa } from "@/data/mockData";

const FASES: LeadEtapa[] = ["Lead recebido", "Qualificado", "Visita agendada", "Visita realizada", "Proposta", "Fechamento"];

const FASE_LABELS: Record<LeadEtapa, string> = {
  "Lead recebido": "Novo (Diagnóstico)",
  "Qualificado": "Qualificado",
  "Visita agendada": "Visita Agendada",
  "Visita realizada": "Visita Realizada",
  "Proposta": "Proposta Enviada",
  "Fechamento": "Fechamento",
};

interface Atividade {
  id: string;
  tipo: "email" | "ligacao" | "tarefa" | "agenda";
  descricao: string;
  data: string;
  responsavel: string;
}

interface OportunidadeDetalheProps {
  lead: Lead;
  onVoltar: () => void;
  onAvancarEtapa: (leadId: string) => void;
  onSetEtapa: (leadId: string, etapa: LeadEtapa) => void;
}

export default function OportunidadeDetalhe({ lead, onVoltar, onAvancarEtapa, onSetEtapa }: OportunidadeDetalheProps) {
  const [imoveisVinculados, setImoveisVinculados] = useState<string[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([
    ...(lead.historico.length > 0 ? [{
      id: "hist-1",
      tipo: "ligacao" as const,
      descricao: lead.historico[0].mensagem,
      data: lead.historico[0].data,
      responsavel: lead.corretor,
    }] : []),
  ]);
  const [dialogImovel, setDialogImovel] = useState(false);
  const [dialogAtividade, setDialogAtividade] = useState(false);
  const [novaAtividade, setNovaAtividade] = useState({ tipo: "email" as Atividade["tipo"], descricao: "", data: "" });
  const [descricaoOp, setDescricaoOp] = useState("");

  const faseAtualIdx = FASES.indexOf(lead.etapa);

  const imoveisDoCorretor = imoveis.filter(i => i.corretor === lead.corretor || imoveisVinculados.includes(i.id));
  const imoveisLinked = imoveis.filter(i => imoveisVinculados.includes(i.id));

  const valorTotal = imoveisLinked.reduce((acc, i) => acc + i.valor, 0);

  const adicionarAtividade = () => {
    if (!novaAtividade.descricao.trim()) { toast.error("Preencha a descrição."); return; }
    const nova: Atividade = {
      id: `atv-${Date.now()}`,
      tipo: novaAtividade.tipo,
      descricao: novaAtividade.descricao,
      data: novaAtividade.data || new Date().toISOString().slice(0, 16).replace("T", " "),
      responsavel: lead.corretor,
    };
    setAtividades(prev => [nova, ...prev]);
    setNovaAtividade({ tipo: "email", descricao: "", data: "" });
    setDialogAtividade(false);
    toast.success("Atividade registrada!");
  };

  const tipoIcon = { email: <Mail className="h-3.5 w-3.5" />, ligacao: <Phone className="h-3.5 w-3.5" />, tarefa: <ClipboardList className="h-3.5 w-3.5" />, agenda: <Calendar className="h-3.5 w-3.5" /> };
  const tipoLabel = { email: "E-mail", ligacao: "Ligação", tarefa: "Tarefa", agenda: "Agenda" };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onVoltar} className="h-8 gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Oportunidade</p>
          <h3 className="text-lg font-bold">OP-{lead.id.padStart(5, "0")} | {lead.nome}</h3>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
          if (faseAtualIdx < FASES.length - 1) {
            onAvancarEtapa(lead.id);
            toast.success(`Fase avançada para "${FASE_LABELS[FASES[faseAtualIdx + 1]]}"`);
          }
        }} disabled={faseAtualIdx >= FASES.length - 1}>
          <Check className="h-3.5 w-3.5 mr-1" /> Marcar Fase como concluída
        </Button>
      </div>

      {/* Pipeline Stages Bar */}
      <div className="flex rounded-lg overflow-hidden border">
        {FASES.map((fase, idx) => {
          const isActive = idx === faseAtualIdx;
          const isPast = idx < faseAtualIdx;
          return (
            <button
              key={fase}
              onClick={() => onSetEtapa(lead.id, fase)}
              className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors border-r last:border-r-0 ${
                isActive ? "bg-primary text-primary-foreground" :
                isPast ? "bg-primary/20 text-primary" :
                "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {FASE_LABELS[fase]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Informações da Oportunidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Proprietário</span>
                <span className="font-medium text-primary">{lead.corretor}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Nome da oportunidade</span>
                <span className="font-medium text-xs">OP-{lead.id.padStart(5, "0")} | {lead.nome}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Telefone</span>
                <span className="font-medium">{lead.telefone}</span>
              </div>
              {lead.email && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">E-mail</span>
                  <span className="font-medium text-xs">{lead.email}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Canal</span>
                <Badge variant="secondary" className="text-xs">{lead.canal}</Badge>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Data de entrada</span>
                <span className="font-medium">{lead.dataEntrada}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Fase</span>
                <Badge className="text-xs">{FASE_LABELS[lead.etapa]}</Badge>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Valor Total</span>
                <span className="font-bold text-primary">
                  {valorTotal > 0 ? `R$ ${valorTotal.toLocaleString("pt-BR")}` : "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Descrição</span>
                <Textarea
                  className="mt-1 text-xs min-h-[60px]"
                  placeholder="Adicionar descrição da oportunidade..."
                  value={descricaoOp}
                  onChange={(e) => setDescricaoOp(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Imóveis + Atividades */}
        <div className="lg:col-span-2 space-y-4">
          {/* Imóveis de Interesse */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Imóveis de Interesse ({imoveisLinked.length})
              </CardTitle>
              <Dialog open={dialogImovel} onOpenChange={setDialogImovel}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Adicionar Imóvel
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Vincular Imóvel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {imoveis.filter(i => !imoveisVinculados.includes(i.id)).map(imovel => (
                      <div
                        key={imovel.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setImoveisVinculados(prev => [...prev, imovel.id]);
                          setDialogImovel(false);
                          toast.success(`${imovel.nome} vinculado à oportunidade!`);
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium">{imovel.nome}</p>
                          <p className="text-xs text-muted-foreground">{imovel.tipo} · R$ {imovel.valor.toLocaleString("pt-BR")}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{imovel.status}</Badge>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {imoveisLinked.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum imóvel vinculado. Clique em "Adicionar Imóvel" para vincular.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-medium text-xs">#</th>
                        <th className="text-left p-2 font-medium text-xs">Imóvel</th>
                        <th className="text-left p-2 font-medium text-xs">Valor</th>
                        <th className="text-left p-2 font-medium text-xs">Tipo</th>
                        <th className="p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {imoveisLinked.map((im, idx) => (
                        <tr key={im.id} className="border-b hover:bg-muted/30">
                          <td className="p-2 text-xs">{idx + 1}</td>
                          <td className="p-2 text-xs font-medium text-primary">{im.nome}</td>
                          <td className="p-2 text-xs">R$ {im.valor.toLocaleString("pt-BR")}</td>
                          <td className="p-2 text-xs">{im.tipo}</td>
                          <td className="p-2">
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive"
                              onClick={() => {
                                setImoveisVinculados(prev => prev.filter(id => id !== im.id));
                                toast.info(`${im.nome} removido.`);
                              }}>✕</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atividades e Chatter */}
          <Card>
            <CardHeader className="pb-2">
              <Tabs defaultValue="atividades" className="w-full">
                <TabsList className="h-8 bg-transparent p-0 gap-4">
                  <TabsTrigger value="atividades" className="h-8 text-xs px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                    <ClipboardList className="h-3.5 w-3.5 mr-1" /> Atividades
                  </TabsTrigger>
                  <TabsTrigger value="chatter" className="h-8 text-xs px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                    <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chatter
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="atividades" className="mt-3 space-y-3">
                  {/* Quick action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {(["email", "ligacao", "tarefa", "agenda"] as const).map(tipo => (
                      <Button key={tipo} size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                        onClick={() => { setNovaAtividade(p => ({ ...p, tipo })); setDialogAtividade(true); }}>
                        {tipoIcon[tipo]} + {tipoLabel[tipo]}
                      </Button>
                    ))}
                  </div>

                  {/* Activities list */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {atividades.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        Nenhuma atividade a mostrar.<br />Comece registrando um e-mail, ligação ou tarefa.
                      </p>
                    ) : (
                      atividades.map(atv => (
                        <div key={atv.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {tipoIcon[atv.tipo]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{atv.descricao}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                              <span>{atv.responsavel}</span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {atv.data}</span>
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">{tipoLabel[atv.tipo]}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="chatter" className="mt-3">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {lead.historico.map((msg, i) => (
                      <div key={i} className={`flex ${msg.remetente === "Sofia" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${msg.remetente === "Sofia" ? "bg-primary/10 text-foreground" : "bg-accent/20 text-foreground"}`}>
                          <p className="font-medium text-[10px] text-muted-foreground mb-0.5">{msg.remetente} · {msg.data}</p>
                          <p>{msg.mensagem}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          {/* Arquivos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" /> Arquivos (0)
              </CardTitle>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.info("Upload de arquivos será habilitado com o backend.")}>
                Adicionar arquivos
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <p className="text-xs text-muted-foreground">Arraste ou clique para carregar arquivos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Nova Atividade */}
      <Dialog open={dialogAtividade} onOpenChange={setDialogAtividade}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Atividade — {tipoLabel[novaAtividade.tipo]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={novaAtividade.tipo} onValueChange={(v) => setNovaAtividade(p => ({ ...p, tipo: v as Atividade["tipo"] }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["email", "ligacao", "tarefa", "agenda"] as const).map(t => (
                    <SelectItem key={t} value={t}>{tipoLabel[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Textarea className="text-sm min-h-[80px]" placeholder="Descreva a atividade..."
                value={novaAtividade.descricao} onChange={(e) => setNovaAtividade(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data/Hora (opcional)</Label>
              <Input type="datetime-local" className="h-8 text-sm"
                value={novaAtividade.data} onChange={(e) => setNovaAtividade(p => ({ ...p, data: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogAtividade(false)}>Cancelar</Button>
            <Button size="sm" onClick={adicionarAtividade}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
