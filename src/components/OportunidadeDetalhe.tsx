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
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Phone, ClipboardList, Calendar, Building2, FileText, Plus, Check, User, Clock, MessageSquare, Edit2, ChevronDown, ChevronUp, Send } from "lucide-react";
import { toast } from "sonner";
import { imoveis, type Lead, type LeadEtapa } from "@/data/mockData";

const FASES: LeadEtapa[] = ["Lead recebido", "Qualificado", "Visita agendada", "Visita realizada", "Proposta", "Fechamento"];

const FASE_LABELS: Record<LeadEtapa, string> = {
  "Lead recebido": "Novo",
  "Qualificado": "Qualificado",
  "Visita agendada": "Visita Agendada",
  "Visita realizada": "Visita Realizada",
  "Proposta": "Proposta",
  "Fechamento": "Convertido",
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

// Left sidebar - Lead Info
function LeadInfoSidebar({ lead }: { lead: Lead }) {
  const [showAll, setShowAll] = useState(false);

  const fields = [
    { label: "Proprietário do lead", value: lead.corretor, highlight: true },
    { label: "Status do lead", value: FASE_LABELS[lead.etapa] },
    { label: "Nome completo", value: lead.nome },
    { label: "Produto", value: "—" },
    { label: "Empresa", value: "—" },
    { label: "Celular", value: lead.telefone, link: true },
    { label: "Email", value: lead.email || "—" },
    { label: "Canal", value: lead.canal },
    { label: "Origem do lead", value: lead.origem },
    { label: "Data de entrada", value: lead.dataEntrada },
    { label: "Classificação", value: "—" },
    { label: "CNPJ/CPF", value: "—" },
    { label: "Endereço", value: "—" },
    { label: "Faixa Dias s/ Atividade", value: "≤ 30 dias", badge: "green" },
    { label: "Motivo da Desqualificação", value: "—" },
  ];

  const visibleFields = showAll ? fields : fields.slice(0, 10);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <ChevronDown className="h-3.5 w-3.5" /> Informações do Lead
        </h4>
      </div>
      {visibleFields.map((f, i) => (
        <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 group">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground">{f.label}</p>
            {f.highlight ? (
              <p className="text-xs font-medium text-primary">{f.value}</p>
            ) : f.link ? (
              <p className="text-xs font-medium text-primary underline cursor-pointer">{f.value}</p>
            ) : f.badge === "green" ? (
              <span className="text-xs font-medium flex items-center gap-1">{f.value} <span className="inline-block w-2 h-2 rounded-full bg-green-500" /></span>
            ) : (
              <p className="text-xs font-medium">{f.value}</p>
            )}
          </div>
          <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer flex-shrink-0" />
        </div>
      ))}
      {fields.length > 10 && (
        <Button variant="ghost" size="sm" className="w-full h-7 text-[10px] mt-1" onClick={() => setShowAll(!showAll)}>
          {showAll ? <><ChevronUp className="h-3 w-3 mr-1" /> Mostrar menos</> : <><ChevronDown className="h-3 w-3 mr-1" /> Mostrar mais</>}
        </Button>
      )}
    </div>
  );
}

// Right panel - Chat
function ChatterPanel({ lead }: { lead: Lead }) {
  const [msg, setMsg] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 pb-2 border-b mb-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">{lead.nome}</p>
          <p className="text-[10px] text-muted-foreground">{lead.telefone}</p>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px] py-2">
        {lead.historico.map((msg, i) => (
          <div key={i} className={`flex ${msg.remetente === "Sofia" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
              msg.remetente === "Sofia"
                ? "bg-green-600/90 text-white rounded-br-none"
                : "bg-muted text-foreground rounded-bl-none"
            }`}>
              <p>{msg.mensagem}</p>
              <p className="text-[9px] mt-1 opacity-70 text-right">{msg.data.split(" ")[1] || msg.data}</p>
            </div>
          </div>
        ))}
        {lead.historico.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhuma mensagem ainda.</p>
        )}
      </div>
      <div className="flex gap-1.5 pt-2 border-t mt-auto">
        <Input
          className="h-8 text-xs flex-1"
          placeholder="Digite uma mensagem..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && msg.trim()) { toast.info("Envio será habilitado com backend."); setMsg(""); } }}
        />
        <Button size="sm" className="h-8 w-8 p-0" onClick={() => { if (msg.trim()) { toast.info("Envio será habilitado com backend."); setMsg(""); } }}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
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

  const faseAtualIdx = FASES.indexOf(lead.etapa);
  const imoveisLinked = imoveis.filter(i => imoveisVinculados.includes(i.id));

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
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onVoltar} className="h-8 gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div>
            <p className="text-[10px] text-muted-foreground">Lead</p>
            <h3 className="text-lg font-bold">{lead.nome}</h3>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs">Editar</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs text-destructive border-destructive/30">Excluir</Button>
          <Button size="sm" className="h-8 text-xs">Converter</Button>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="flex rounded-lg overflow-hidden border">
        {FASES.map((fase, idx) => {
          const isActive = idx === faseAtualIdx;
          const isPast = idx < faseAtualIdx;
          return (
            <button
              key={fase}
              onClick={() => onSetEtapa(lead.id, fase)}
              className={`flex-1 py-2 text-xs font-medium text-center transition-colors border-r last:border-r-0 relative ${
                isActive ? "bg-primary text-primary-foreground" :
                isPast ? "bg-primary/20 text-primary" :
                "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {isPast && <Check className="h-3 w-3 inline mr-1" />}
              {FASE_LABELS[fase]}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">Status: <span className="font-medium text-foreground">{FASE_LABELS[lead.etapa]}</span></p>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => {
          if (faseAtualIdx < FASES.length - 1) {
            onAvancarEtapa(lead.id);
            toast.success(`Fase avançada para "${FASE_LABELS[FASES[faseAtualIdx + 1]]}"`);
          }
        }} disabled={faseAtualIdx >= FASES.length - 1}>
          <Check className="h-3 w-3" /> Marcar Status como concluído(a)
        </Button>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-4">
        {/* LEFT: Lead Info */}
        <Card className="h-fit">
          <CardContent className="pt-4 pb-3">
            <LeadInfoSidebar lead={lead} />
          </CardContent>
        </Card>

        {/* CENTER: Atividades / Detalhes / Relacionados */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <Tabs defaultValue="atividades">
                <TabsList className="h-9 bg-transparent p-0 gap-6 border-b w-full justify-start rounded-none">
                  <TabsTrigger value="atividades" className="h-9 text-xs px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Atividades
                  </TabsTrigger>
                  <TabsTrigger value="detalhes" className="h-9 text-xs px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Detalhes
                  </TabsTrigger>
                  <TabsTrigger value="relacionados" className="h-9 text-xs px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                    <Building2 className="h-3.5 w-3.5 mr-1.5" /> Relacionados
                  </TabsTrigger>
                </TabsList>

                {/* Atividades */}
                <TabsContent value="atividades" className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(["ligacao", "tarefa", "agenda", "email"] as const).map(tipo => (
                      <Button key={tipo} size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                        onClick={() => { setNovaAtividade(p => ({ ...p, tipo })); setDialogAtividade(true); }}>
                        {tipoIcon[tipo]} + {tipoLabel[tipo]}
                      </Button>
                    ))}
                  </div>

                  <p className="text-[10px] text-muted-foreground">Filtros: Período integral · Todas as atividades · Todos os tipos</p>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto">
                    {atividades.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xs text-muted-foreground">Nenhuma atividade a mostrar.</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Comece enviando um email, agendando uma tarefa e muito mais.</p>
                      </div>
                    ) : (
                      atividades.map(atv => (
                        <div key={atv.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {tipoIcon[atv.tipo]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{atv.descricao}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                              <span className="text-primary">{atv.responsavel}</span>
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

                {/* Detalhes */}
                <TabsContent value="detalhes" className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Nome</p>
                      <p className="text-xs font-medium">{lead.nome}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Telefone</p>
                      <p className="text-xs font-medium">{lead.telefone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Email</p>
                      <p className="text-xs font-medium">{lead.email || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Canal</p>
                      <p className="text-xs font-medium">{lead.canal}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Corretor</p>
                      <p className="text-xs font-medium">{lead.corretor}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Origem</p>
                      <p className="text-xs font-medium">{lead.origem}</p>
                    </div>
                  </div>
                </TabsContent>

                {/* Relacionados (Imóveis) */}
                <TabsContent value="relacionados" className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" /> Imóveis de Interesse ({imoveisLinked.length})
                    </h4>
                    <Dialog open={dialogImovel} onOpenChange={setDialogImovel}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <Plus className="h-3 w-3" /> Adicionar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Vincular Imóvel</DialogTitle></DialogHeader>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {imoveis.filter(i => !imoveisVinculados.includes(i.id)).map(imovel => (
                            <div key={imovel.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                              onClick={() => { setImoveisVinculados(prev => [...prev, imovel.id]); setDialogImovel(false); toast.success(`${imovel.nome} vinculado!`); }}>
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
                  </div>
                  {imoveisLinked.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">Nenhum imóvel vinculado.</p>
                  ) : (
                    <div className="space-y-2">
                      {imoveisLinked.map(im => (
                        <div key={im.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="text-xs font-medium text-primary">{im.nome}</p>
                            <p className="text-[10px] text-muted-foreground">{im.tipo} · R$ {im.valor.toLocaleString("pt-BR")}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive"
                            onClick={() => { setImoveisVinculados(prev => prev.filter(id => id !== im.id)); toast.info(`${im.nome} removido.`); }}>✕</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Chatter */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <div className="flex gap-4">
              <CardTitle className="text-sm font-semibold text-primary border-b-2 border-primary pb-1">Chatter</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ChatterPanel lead={lead} />
          </CardContent>
        </Card>
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
