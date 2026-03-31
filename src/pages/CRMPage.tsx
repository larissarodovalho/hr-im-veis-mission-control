// corretorId prop (future auth): quando cada corretor logar, passar corretorId para filtrar
// apenas os dados do corretor autenticado. Ex: <CRM corretorId="hans" />
// const corretorId: string | undefined = undefined;

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { leads as leadsIniciais, imoveis, corretoresRanking, funnelPorCorretor, contas, oportunidades, leadsPorOrigem, leadsTotaisPorOrigem, produtosPorLead, motivosDesqualificacao, oportunidadesFases, motivosDaPerda, vgv, ticketMedio, visitas as visitasIniciais, visitasPorTipoImovel, tarefas, type TipoTarefa, type StatusTarefa, type StatusVisita, type Visita, type Lead, type LeadEtapa } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, CartesianGrid } from "recharts";
import { ChevronDown, ChevronUp, Phone, MessageSquare, DollarSign, Users, Trophy, TrendingUp, Building2, ClipboardList, BarChart2, HandCoins, CalendarCheck, CheckCircle2, Clock, AlertCircle, Circle, ArrowRight, Home } from "lucide-react";
import { toast } from "sonner";
import ImoveisTab from "@/components/ImoveisTab";

const ETAPAS_ORDEM: LeadEtapa[] = ["Lead recebido", "Qualificado", "Visita agendada", "Visita realizada", "Proposta", "Fechamento"];

type Periodo = "Tudo" | "Este mês" | "Mês anterior" | "Este ano";

const FILLS = { Hans: "hsl(224, 73%, 45%)", Rafael: "hsl(160, 60%, 42%)", Gabriel: "hsl(43, 76%, 48%)" };
const CORRETORES = ["Hans", "Rafael", "Gabriel"] as const;

function filtrarPorData<T extends { dataCreacao: string }>(items: T[], periodo: Periodo): T[] {
  if (periodo === "Tudo") return items;
  const agora = new Date();
  return items.filter((item) => {
    const d = new Date(item.dataCreacao);
    if (periodo === "Este mês") return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
    if (periodo === "Mês anterior") {
      const mes = agora.getMonth() === 0 ? 11 : agora.getMonth() - 1;
      const ano = agora.getMonth() === 0 ? agora.getFullYear() - 1 : agora.getFullYear();
      return d.getMonth() === mes && d.getFullYear() === ano;
    }
    if (periodo === "Este ano") return d.getFullYear() === agora.getFullYear();
    return true;
  });
}

function porCorretor<T extends { corretor: string }>(items: T[]) {
  return CORRETORES.map((nome) => ({ nome, quantidade: items.filter((i) => i.corretor === nome).length, fill: FILLS[nome] }));
}

const PeriodoSelect = ({ value, onChange }: { value: Periodo; onChange: (v: Periodo) => void }) => (
  <Select value={value} onValueChange={(v) => onChange(v as Periodo)}>
    <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
    <SelectContent>
      {(["Tudo", "Este mês", "Mês anterior", "Este ano"] as Periodo[]).map((p) => (
        <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default function CRM() {
  const [dialogNovoLead, setDialogNovoLead] = useState(false);
  const [novoLead, setNovoLead] = useState({
    nome: "", telefone: "", canal: "Meta Ads" as Lead["canal"],
    corretor: "Hans" as Lead["corretor"], origem: "Marketing" as Lead["origem"],
  });
  const [listaLeads, setListaLeads] = useState<Lead[]>([...leadsIniciais]);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [visaoCC, setVisaoCC]           = useState<"geral" | "corretor">("geral");
  const [filtroCorretor, setFiltroCorretor]         = useState<"Todos" | "Hans" | "Rafael" | "Gabriel">("Todos");
  const [filtroTipo, setFiltroTipo]                 = useState<"Todos" | TipoTarefa>("Todos");
  const [filtroStatus, setFiltroStatus]             = useState<"Todos" | StatusTarefa>("Todos");
  const [filtroStatusVisita, setFiltroStatusVisita] = useState<"Todos" | StatusVisita>("Todos");
  const [filtroCorretorVisita, setFiltroCorretorVisita] = useState<"Todos" | "Hans" | "Rafael" | "Gabriel">("Todos");
  const [listaVisitas, setListaVisitas] = useState<Visita[]>(visitasIniciais);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novaVisita, setNovaVisita] = useState({
    conta: "", corretor: "Hans" as "Hans" | "Rafael" | "Gabriel",
    imovel: "", tipoImovel: "Casa" as "Casa" | "Terreno" | "Apartamento",
    dataVisita: "", status: "Agendada" as StatusVisita,
  });
  const [corretorSelecionado, setCorretorSelecionado] = useState<typeof CORRETORES[number]>("Hans");
  const [periodoLeads, setPeriodoLeads]   = useState<Periodo>("Tudo");
  const [periodoContas, setPeriodoContas] = useState<Periodo>("Tudo");
  const [periodoOps, setPeriodoOps]       = useState<Periodo>("Tudo");

  const avancarEtapa = (leadId: string) => {
    setListaLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const idx = ETAPAS_ORDEM.indexOf(l.etapa);
      if (idx < ETAPAS_ORDEM.length - 1) {
        const novaEtapa = ETAPAS_ORDEM[idx + 1];
        toast.success(`${l.nome} avançou para "${novaEtapa}"`);
        return { ...l, etapa: novaEtapa };
      }
      return l;
    }));
  };

  const leadsF  = useMemo(() => filtrarPorData(listaLeads.map(l => ({ ...l, dataCreacao: l.dataEntrada })), periodoLeads),  [periodoLeads, listaLeads]);
  const contasF = useMemo(() => filtrarPorData(contas,        periodoContas), [periodoContas]);
  const opsF    = useMemo(() => filtrarPorData(oportunidades, periodoOps),    [periodoOps]);

  const leadsPorCorretor  = useMemo(() => porCorretor(leadsF),  [leadsF]);
  const contasPorCorretor = useMemo(() => porCorretor(contasF), [contasF]);
  const opsPorCorretor    = useMemo(() => porCorretor(opsF),    [opsF]);

  const funnelDinamico = useMemo(() => ETAPAS_ORDEM.map((etapa, i) => ({
    etapa,
    quantidade: listaLeads.filter(l => l.etapa === etapa).length,
    fill: `hsl(224, 73%, ${40 + i * 8}%)`,
  })), [listaLeads]);

  const totalEmNegociacao = imoveis
    .filter((i) => i.status === "Em negociação")
    .reduce((acc, i) => acc + i.valor, 0);

  const visitasAgendadas = listaLeads.filter((l) => l.etapa === "Visita agendada").length;
  const visitasRealizadas = listaLeads.filter((l) => l.etapa === "Visita realizada").length;
  const taxaComparecimento =
    visitasAgendadas > 0
      ? (((visitasRealizadas) / (visitasAgendadas + visitasRealizadas)) * 100).toFixed(0)
      : "0";

  return (
    <div className="space-y-6">
      <h2 className="section-title">CRM — Comercial</h2>

      <Tabs defaultValue="leads">
        <TabsList className="h-8 bg-muted/50 rounded-md p-0.5 gap-0.5 mb-2 flex-wrap">
          <TabsTrigger value="leads" className="h-7 text-xs px-3 flex items-center gap-1.5 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="h-3.5 w-3.5" /> Leads
          </TabsTrigger>
          <TabsTrigger value="contatos" className="h-7 text-xs px-3 flex items-center gap-1.5 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Phone className="h-3.5 w-3.5" /> Contatos
          </TabsTrigger>
          <TabsTrigger value="kanban" className="h-7 text-xs px-3 flex items-center gap-1.5 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Building2 className="h-3.5 w-3.5" /> Kanban
          </TabsTrigger>
          <TabsTrigger value="imoveis" className="h-7 text-xs px-3 flex items-center gap-1.5 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Home className="h-3.5 w-3.5" /> Imóveis
          </TabsTrigger>
          <TabsTrigger value="funil" className="h-7 text-xs px-3 flex items-center gap-1.5 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <TrendingUp className="h-3.5 w-3.5" /> Funil de Vendas
          </TabsTrigger>
          <TabsTrigger value="criacao" className="h-7 text-xs px-3 flex items-center gap-1.5 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ClipboardList className="h-3.5 w-3.5" /> Controle de Criação
          </TabsTrigger>
          <TabsTrigger value="analise" className="h-7 text-xs px-3 flex items-center gap-1.5 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BarChart2 className="h-3.5 w-3.5" /> Análise de Leads
          </TabsTrigger>
          <TabsTrigger value="oportunidades" className="h-7 text-xs px-3 flex items-center gap-1.5 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <HandCoins className="h-3.5 w-3.5" /> Oportunidades
          </TabsTrigger>
          <TabsTrigger value="visitas" className="h-7 text-xs px-3 flex items-center gap-1.5 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CalendarCheck className="h-3.5 w-3.5" /> Visitas
          </TabsTrigger>
          <TabsTrigger value="tarefas" className="h-7 text-xs px-3 flex items-center gap-1.5 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" /> Tarefas
          </TabsTrigger>
        </TabsList>

        {/* ── ABA: Leads (para qualificar) ── */}
        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Leads — Para Qualificar</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{listaLeads.filter(l => l.etapa === "Lead recebido").length} leads</Badge>
                <Dialog open={dialogNovoLead} onOpenChange={setDialogNovoLead}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-7 text-xs">+ Novo Lead</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Lead</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nome completo</Label>
                        <Input className="h-8 text-sm" placeholder="Ex: João da Silva" maxLength={100} value={novoLead.nome}
                          onChange={(e) => setNovoLead(p => ({ ...p, nome: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Telefone</Label>
                        <Input className="h-8 text-sm" placeholder="(66) 99999-0000" maxLength={20} value={novoLead.telefone}
                          onChange={(e) => setNovoLead(p => ({ ...p, telefone: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Canal de Origem</Label>
                        <Select value={novoLead.canal} onValueChange={(v) => setNovoLead(p => ({ ...p, canal: v as Lead["canal"] }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["Meta Ads", "Google Ads", "Indicação", "Orgânico"] as const).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Corretor Responsável</Label>
                        <Select value={novoLead.corretor} onValueChange={(v) => setNovoLead(p => ({ ...p, corretor: v as Lead["corretor"] }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CORRETORES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Tipo de Origem</Label>
                        <Select value={novoLead.origem} onValueChange={(v) => setNovoLead(p => ({ ...p, origem: v as Lead["origem"] }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["Carteira", "Marketing"] as const).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" size="sm" onClick={() => setDialogNovoLead(false)}>Cancelar</Button>
                      <Button size="sm" onClick={() => {
                        const nome = novoLead.nome.trim();
                        const telefone = novoLead.telefone.trim();
                        if (!nome || !telefone) { toast.error("Preencha nome e telefone."); return; }
                        const novo: Lead = {
                          id: `lead-${Date.now()}`,
                          nome,
                          telefone,
                          canal: novoLead.canal,
                          corretor: novoLead.corretor,
                          origem: novoLead.origem,
                          etapa: "Lead recebido",
                          dataEntrada: new Date().toISOString().slice(0, 10),
                          historico: [{ data: new Date().toISOString().slice(0, 16).replace("T", " "), mensagem: `Novo lead cadastrado manualmente. Canal: ${novoLead.canal}.`, remetente: "Sofia" }],
                        };
                        setListaLeads(prev => [novo, ...prev]);
                        setNovoLead({ nome: "", telefone: "", canal: "Meta Ads", corretor: "Hans", origem: "Marketing" });
                        setDialogNovoLead(false);
                        toast.success(`Lead "${nome}" cadastrado com sucesso!`);
                      }}>Cadastrar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Nome</th>
                      <th className="text-left p-3 font-medium hidden sm:table-cell">Telefone</th>
                      <th className="text-left p-3 font-medium">Canal</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Origem</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Corretor</th>
                      <th className="text-left p-3 font-medium hidden lg:table-cell">Entrada</th>
                      <th className="text-left p-3 font-medium">Ação</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaLeads.filter(l => l.etapa === "Lead recebido").map((lead) => (
                      <>
                        <tr
                          key={lead.id}
                          className="border-b hover:bg-muted/30 cursor-pointer"
                          onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                        >
                          <td className="p-3 font-medium">{lead.nome}</td>
                          <td className="p-3 hidden sm:table-cell">
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.telefone}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant={lead.canal === "Meta Ads" ? "default" : "secondary"} className="text-xs">{lead.canal}</Badge>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <Badge variant="outline" className={`text-xs ${lead.origem === "Carteira" ? "border-blue-500 text-blue-600" : "border-amber-500 text-amber-600"}`}>{lead.origem}</Badge>
                          </td>
                          <td className="p-3 hidden md:table-cell">{lead.corretor}</td>
                          <td className="p-3 hidden lg:table-cell text-muted-foreground">{lead.dataEntrada}</td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-green-500 text-green-600 hover:bg-green-50" onClick={(e) => { e.stopPropagation(); avancarEtapa(lead.id); }}>
                              Qualificar <ArrowRight className="h-3 w-3" />
                            </Button>
                          </td>
                          <td className="p-3">
                            {expandedLead === lead.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </td>
                        </tr>
                        {expandedLead === lead.id && (
                          <tr key={`${lead.id}-hist`}>
                            <td colSpan={8} className="p-4 bg-muted/20">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Histórico — Sofia IA</p>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {lead.historico.map((msg, i) => (
                                  <div key={i} className={`flex ${msg.remetente === "Sofia" ? "justify-start" : "justify-end"}`}>
                                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${msg.remetente === "Sofia" ? "bg-primary/10 text-foreground" : "bg-accent/20 text-foreground"}`}>
                                      <p className="font-medium text-[10px] text-muted-foreground mb-0.5">{msg.remetente} · {msg.data}</p>
                                      <p>{msg.mensagem}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA: Contatos (já qualificados) ── */}
        <TabsContent value="contatos" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Contatos — Leads Qualificados</CardTitle>
              <Badge variant="outline" className="text-xs">{listaLeads.filter(l => l.etapa !== "Lead recebido").length} contatos</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Nome</th>
                      <th className="text-left p-3 font-medium hidden sm:table-cell">Telefone</th>
                      <th className="text-left p-3 font-medium">Canal</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Origem</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Corretor</th>
                      <th className="text-left p-3 font-medium">Etapa</th>
                      <th className="text-left p-3 font-medium hidden lg:table-cell">Entrada</th>
                      <th className="text-left p-3 font-medium">Ação</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaLeads.filter(l => l.etapa !== "Lead recebido").map((lead) => (
                      <>
                        <tr
                          key={lead.id}
                          className="border-b hover:bg-muted/30 cursor-pointer"
                          onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                        >
                          <td className="p-3 font-medium">{lead.nome}</td>
                          <td className="p-3 hidden sm:table-cell">
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.telefone}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant={lead.canal === "Meta Ads" ? "default" : "secondary"} className="text-xs">{lead.canal}</Badge>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <Badge variant="outline" className={`text-xs ${lead.origem === "Carteira" ? "border-blue-500 text-blue-600" : "border-amber-500 text-amber-600"}`}>{lead.origem}</Badge>
                          </td>
                          <td className="p-3 hidden md:table-cell">{lead.corretor}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">{lead.etapa}</Badge>
                          </td>
                          <td className="p-3 hidden lg:table-cell text-muted-foreground">{lead.dataEntrada}</td>
                          <td className="p-3">
                            {lead.etapa !== "Fechamento" ? (
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-primary text-primary hover:bg-primary/5" onClick={(e) => { e.stopPropagation(); avancarEtapa(lead.id); }}>
                                {ETAPAS_ORDEM[ETAPAS_ORDEM.indexOf(lead.etapa) + 1]} <ArrowRight className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Badge className="text-xs bg-green-500">✓ Fechado</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            {expandedLead === lead.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </td>
                        </tr>
                        {expandedLead === lead.id && (
                          <tr key={`${lead.id}-hist`}>
                            <td colSpan={9} className="p-4 bg-muted/20">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">Histórico — Sofia IA</p>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {lead.historico.map((msg, i) => (
                                  <div key={i} className={`flex ${msg.remetente === "Sofia" ? "justify-start" : "justify-end"}`}>
                                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${msg.remetente === "Sofia" ? "bg-primary/10 text-foreground" : "bg-accent/20 text-foreground"}`}>
                                      <p className="font-medium text-[10px] text-muted-foreground mb-0.5">{msg.remetente} · {msg.data}</p>
                                      <p>{msg.mensagem}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA: Kanban ── */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Acompanhe o progresso dos leads pelo funil de vendas</p>
            <Badge variant="outline" className="text-xs">{listaLeads.length} leads total</Badge>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {ETAPAS_ORDEM.map((etapa, colIdx) => {
              const leadsNaEtapa = listaLeads.filter(l => l.etapa === etapa);
              const colColors = [
                "bg-primary text-primary-foreground",
                "bg-blue-500 text-white",
                "bg-amber-500 text-white",
                "bg-orange-500 text-white",
                "bg-emerald-500 text-white",
                "bg-green-600 text-white",
              ];
              return (
                <div key={etapa} className="flex-shrink-0 w-[220px] flex flex-col">
                  <div className={`rounded-t-lg px-3 py-2 text-center ${colColors[colIdx]}`}>
                    <p className="text-xs font-bold truncate">{etapa} ({leadsNaEtapa.length})</p>
                  </div>
                  <div className="flex-1 border-x border-b rounded-b-lg bg-muted/10 p-2 space-y-2 min-h-[200px]">
                    {leadsNaEtapa.map(lead => (
                      <div key={lead.id} className="bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-mono text-muted-foreground">OP-{lead.id.padStart(5, "0")}</p>
                            <p className="text-xs font-semibold truncate">{lead.nome}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{lead.canal}</p>
                          </div>
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-primary">{lead.corretor.charAt(0)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${lead.origem === "Carteira" ? "border-blue-400 text-blue-500" : "border-amber-400 text-amber-500"}`}>
                            {lead.origem}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground ml-auto">{lead.dataEntrada}</span>
                        </div>
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {colIdx > 0 && (
                            <Button size="sm" variant="ghost" className="h-5 text-[9px] px-1.5 text-muted-foreground"
                              onClick={() => {
                                setListaLeads(prev => prev.map(l => l.id === lead.id ? { ...l, etapa: ETAPAS_ORDEM[colIdx - 1] } : l));
                                toast.info(`${lead.nome} voltou para "${ETAPAS_ORDEM[colIdx - 1]}"`);
                              }}>
                              ← Voltar
                            </Button>
                          )}
                          {colIdx < ETAPAS_ORDEM.length - 1 && (
                            <Button size="sm" variant="default" className="h-5 text-[9px] px-1.5 ml-auto"
                              onClick={() => avancarEtapa(lead.id)}>
                              Avançar →
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {leadsNaEtapa.length === 0 && (
                      <p className="text-[10px] text-muted-foreground text-center py-8">Nenhum lead</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── ABA: Imóveis ── */}
        <TabsContent value="imoveis" className="space-y-4">
          <ImoveisTab />
        </TabsContent>

        {/* ── ABA: Funil de Vendas ── */}
        <TabsContent value="funil" className="space-y-6">

      {/* Funil por Corretor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funil por Corretor</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hans">
            <TabsList className="mb-4">
              <TabsTrigger value="hans">Hans Rodovalho</TabsTrigger>
              <TabsTrigger value="rafael">Rafael Filimberti</TabsTrigger>
              <TabsTrigger value="gabriel">Gabriel Souza</TabsTrigger>
            </TabsList>

            {funnelPorCorretor.map((fc) => (
              <TabsContent key={fc.corretorId} value={fc.corretorId} className="space-y-4">
                {/* Stats do corretor */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Total de Leads</span>
                    </div>
                    <p className="text-xl font-bold font-display">{fc.stats.totalLeads}</p>
                  </div>
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">Taxa de Conversão</span>
                    </div>
                    <p className="text-xl font-bold font-display">{fc.stats.taxaConversao}%</p>
                  </div>
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-gold" />
                      <span className="text-xs text-muted-foreground">Pipeline em Negociação</span>
                    </div>
                    <p className="text-xl font-bold font-display">
                      R$ {fc.stats.pipelineEmNegociacao.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Dois funis lado a lado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Carteira */}
                  <div>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                      Carteira
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={fc.carteira} layout="vertical" margin={{ left: 120 }}>
                        <XAxis type="number" fontSize={11} allowDecimals={false} />
                        <YAxis type="category" dataKey="etapa" fontSize={10} width={115} />
                        <Tooltip formatter={(v) => [v, "Leads"]} />
                        <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                          {fc.carteira.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Marketing */}
                  <div>
                    <p className="text-sm font-semibold text-amber-500 mb-2 flex items-center gap-1">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Marketing
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={fc.marketing} layout="vertical" margin={{ left: 120 }}>
                        <XAxis type="number" fontSize={11} allowDecimals={false} />
                        <YAxis type="category" dataKey="etapa" fontSize={10} width={115} />
                        <Tooltip formatter={(v) => [v, "Leads"]} />
                        <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                          {fc.marketing.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Pipeline + Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-gold" />
            <span className="text-sm text-muted-foreground">Pipeline em Negociação</span>
          </div>
          <p className="text-xl font-bold font-display">R$ {totalEmNegociacao.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Visitas Agendadas / Realizadas</span>
          </div>
          <p className="text-xl font-bold font-display">
            {visitasAgendadas + visitasRealizadas} agendadas · {visitasRealizadas} realizadas
          </p>
          <p className="text-xs text-muted-foreground">Taxa de comparecimento: {taxaComparecimento}%</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-gold" />
            <span className="text-sm text-muted-foreground">Ranking Corretores</span>
          </div>
          {corretoresRanking.map((c) => (
            <div key={c.nome} className="flex justify-between text-sm mt-1">
              <span className="font-medium">{c.nome}</span>
              <span className="text-muted-foreground">
                {c.atendimentos} atend · {c.visitas} vis · {c.propostas} prop
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Telefone</th>
                  <th className="text-left p-3 font-medium">Canal</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Origem</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Corretor</th>
                  <th className="text-left p-3 font-medium">Etapa</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Entrada</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {listaLeads.map((lead) => (
                  <>
                    <tr
                      key={lead.id}
                      className="border-b hover:bg-muted/30 cursor-pointer"
                      onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                    >
                      <td className="p-3 font-medium">{lead.nome}</td>
                      <td className="p-3 hidden sm:table-cell">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.telefone}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={lead.canal === "Meta Ads" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {lead.canal}
                        </Badge>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            lead.origem === "Carteira"
                              ? "border-blue-500 text-blue-600 dark:text-blue-400"
                              : "border-amber-500 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {lead.origem}
                        </Badge>
                      </td>
                      <td className="p-3 hidden md:table-cell">{lead.corretor}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {lead.etapa}
                        </Badge>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">
                        {lead.dataEntrada}
                      </td>
                      <td className="p-3">
                        {expandedLead === lead.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </td>
                    </tr>
                    {expandedLead === lead.id && (
                      <tr key={`${lead.id}-hist`}>
                        <td colSpan={8} className="p-4 bg-muted/20">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            Histórico — Sofia IA
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {lead.historico.map((msg, i) => (
                              <div
                                key={i}
                                className={`flex ${
                                  msg.remetente === "Sofia" ? "justify-start" : "justify-end"
                                }`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                                    msg.remetente === "Sofia"
                                      ? "bg-primary/10 text-foreground"
                                      : "bg-accent/20 text-foreground"
                                  }`}
                                >
                                  <p className="font-medium text-[10px] text-muted-foreground mb-0.5">
                                    {msg.remetente} · {msg.data}
                                  </p>
                                  <p>{msg.mensagem}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Imóveis Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Imóveis Cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Imóvel</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Tipo</th>
                  <th className="text-left p-3 font-medium">Valor</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Corretor</th>
                </tr>
              </thead>
              <tbody>
                {imoveis.map((imovel) => (
                  <tr key={imovel.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{imovel.nome}</td>
                    <td className="p-3 hidden sm:table-cell">{imovel.tipo}</td>
                    <td className="p-3">R$ {imovel.valor.toLocaleString()}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          imovel.status === "Vendido"
                            ? "default"
                            : imovel.status === "Em negociação"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {imovel.status}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">{imovel.corretor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

        </TabsContent>

        {/* ── ABA: Controle de Criação ── */}
        <TabsContent value="criacao" className="space-y-4">

          {/* Toggle Geral / Por Corretor */}
          <div className="flex items-center gap-3">
            <Tabs value={visaoCC} onValueChange={(v) => setVisaoCC(v as "geral" | "corretor")}>
              <TabsList className="h-8 bg-muted/50 rounded-md p-0.5">
                <TabsTrigger value="geral" className="h-7 text-xs px-3 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Geral
                </TabsTrigger>
                <TabsTrigger value="corretor" className="h-7 text-xs px-3 rounded data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Por Corretor
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {visaoCC === "corretor" && (
              <Select value={corretorSelecionado} onValueChange={(v) => setCorretorSelecionado(v as typeof CORRETORES[number])}>
                <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CORRETORES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Leads */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Leads</CardTitle>
                </div>
                <PeriodoSelect value={periodoLeads} onChange={setPeriodoLeads} />
              </CardHeader>
              <CardContent>
                {visaoCC === "geral" ? (
                  <>
                    <p className="text-5xl font-bold font-display text-primary mb-4">{leadsF.length}</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={leadsPorCorretor} layout="vertical" margin={{ left: 80 }}>
                        <XAxis type="number" fontSize={11} allowDecimals={false} />
                        <YAxis type="category" dataKey="nome" fontSize={11} width={75} />
                        <Tooltip formatter={(v) => [v, "Leads"]} />
                        <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                          {leadsPorCorretor.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <p className="text-5xl font-bold font-display text-primary mb-1">
                      {leadsF.filter((l) => l.corretor === corretorSelecionado).length}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">{corretorSelecionado}</p>
                    <div className="space-y-1.5">
                      {(["Lead recebido","Qualificado","Visita agendada","Visita realizada","Proposta","Fechamento"] as const).map((etapa) => {
                        const count = leadsF.filter((l) => l.corretor === corretorSelecionado && l.etapa === etapa).length;
                        return (
                          <div key={etapa} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{etapa}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Contas */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-sm">Contas</CardTitle>
                </div>
                <PeriodoSelect value={periodoContas} onChange={setPeriodoContas} />
              </CardHeader>
              <CardContent>
                {visaoCC === "geral" ? (
                  <>
                    <p className="text-5xl font-bold font-display text-green-500 mb-4">{contasF.length}</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={contasPorCorretor} layout="vertical" margin={{ left: 80 }}>
                        <XAxis type="number" fontSize={11} allowDecimals={false} />
                        <YAxis type="category" dataKey="nome" fontSize={11} width={75} />
                        <Tooltip formatter={(v) => [v, "Contas"]} />
                        <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                          {contasPorCorretor.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <p className="text-5xl font-bold font-display text-green-500 mb-1">
                      {contasF.filter((c) => c.corretor === corretorSelecionado).length}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">{corretorSelecionado}</p>
                    <div className="space-y-1.5">
                      {(["Pessoa Física","Pessoa Jurídica"] as const).map((tipo) => {
                        const count = contasF.filter((c) => c.corretor === corretorSelecionado && c.tipo === tipo).length;
                        return (
                          <div key={tipo} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{tipo}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Oportunidades */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-sm">Oportunidades</CardTitle>
                </div>
                <PeriodoSelect value={periodoOps} onChange={setPeriodoOps} />
              </CardHeader>
              <CardContent>
                {visaoCC === "geral" ? (
                  <>
                    <p className="text-5xl font-bold font-display text-amber-500 mb-4">{opsF.length}</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={opsPorCorretor} layout="vertical" margin={{ left: 80 }}>
                        <XAxis type="number" fontSize={11} allowDecimals={false} />
                        <YAxis type="category" dataKey="nome" fontSize={11} width={75} />
                        <Tooltip formatter={(v) => [v, "Oportunidades"]} />
                        <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                          {opsPorCorretor.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <p className="text-5xl font-bold font-display text-amber-500 mb-1">
                      {opsF.filter((o) => o.corretor === corretorSelecionado).length}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">{corretorSelecionado}</p>
                    <div className="space-y-1.5">
                      {(["Prospecção","Qualificação","Proposta","Negociação","Fechamento"] as const).map((estagio) => {
                        const count = opsF.filter((o) => o.corretor === corretorSelecionado && o.estagio === estagio).length;
                        return (
                          <div key={estagio} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{estagio}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── ABA: Análise de Leads ── */}
        <TabsContent value="analise" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Leads por Proprietário */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Leads por Proprietário</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={corretoresRanking.map((c) => ({ nome: c.nome.split(" ")[0], quantidade: c.atendimentos, fill: FILLS[c.nome.split(" ")[0] as keyof typeof FILLS] ?? "hsl(224,73%,45%)" }))} layout="vertical" margin={{ left: 60 }}>
                    <XAxis type="number" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" fontSize={11} width={55} />
                    <Tooltip formatter={(v) => [v, "Leads"]} />
                    <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                      {corretoresRanking.map((_, i) => <Cell key={i} fill={Object.values(FILLS)[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Origem do Lead */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Origem do Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={leadsPorOrigem} layout="vertical" margin={{ left: 140 }}>
                    <XAxis type="number" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="origem" fontSize={9} width={135} />
                    <Tooltip formatter={(v) => [v, "Leads"]} />
                    <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                      {leadsPorOrigem.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Leads Totais (rosca) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Leads Totais por Origem</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={leadsTotaisPorOrigem} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} label={({ value }) => value}>
                      {leadsTotaisPorOrigem.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center">
                  {leadsTotaisPorOrigem.map((e) => (
                    <span key={e.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: e.fill }} />
                      {e.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Produtos por Lead */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Produtos por Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={produtosPorLead} layout="vertical" margin={{ left: 120 }}>
                    <XAxis type="number" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="produto" fontSize={10} width={115} />
                    <Tooltip formatter={(v) => [v, "Leads"]} />
                    <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                      {produtosPorLead.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Leads criados últimos 7 dias */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Leads criados — últimos 7 dias</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[160px]">
                <div className="text-center">
                  <p className="text-7xl font-bold font-display text-primary leading-none">
                    {listaLeads.filter((l) => {
                      const d = new Date(l.dataEntrada);
                      const semanaAtras = new Date();
                      semanaAtras.setDate(semanaAtras.getDate() - 7);
                      return d >= semanaAtras;
                    }).length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">novos leads</p>
                </div>
              </CardContent>
            </Card>

            {/* Motivo da Desqualificação */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Motivo da Desqualificação</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={motivosDesqualificacao} layout="vertical" margin={{ left: 140 }}>
                    <XAxis type="number" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="motivo" fontSize={9} width={135} />
                    <Tooltip formatter={(v) => [v, "Leads"]} />
                    <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                      {motivosDesqualificacao.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ── ABA: Oportunidades ── */}
        <TabsContent value="oportunidades" className="space-y-4">

          {/* Linha 1: KPIs rápidos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">Todas as Oportunidades</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-6xl font-bold font-display text-primary leading-none">{oportunidades.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">Oportunidades Ganhas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-6xl font-bold font-display text-green-500 leading-none">
                  {oportunidades.filter((o) => o.estagio === "Fechamento").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">Oportunidades Perdidas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-6xl font-bold font-display text-red-500 leading-none">0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">Em Negociação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-6xl font-bold font-display text-amber-500 leading-none">
                  {oportunidades.filter((o) => o.estagio === "Negociação").length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Linha 2: Fases + Motivo da Perda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Fases da Oportunidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={oportunidadesFases} margin={{ bottom: 20 }}>
                    <XAxis dataKey="fase" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, "Oportunidades"]} />
                    <Bar dataKey="quantidade" radius={[5, 5, 0, 0]}>
                      {oportunidadesFases.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Motivo da Perda</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={motivosDaPerda} margin={{ bottom: 20 }}>
                    <XAxis dataKey="motivo" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip formatter={(v) => [v, "Oportunidades"]} />
                    <Bar dataKey="quantidade" radius={[5, 5, 0, 0]}>
                      {motivosDaPerda.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Linha 3: VGV + Ticket Médio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">VGV — Valor Geral de Vendas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-5xl font-bold font-display text-primary leading-none mt-2">
                  R$ {vgv.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {oportunidades.filter((o) => o.estagio === "Fechamento").length} negócios fechados
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-amber-500/20">
              <CardHeader className="pb-1">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-sm">Ticket Médio</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-5xl font-bold font-display text-amber-500 leading-none mt-2">
                  R$ {ticketMedio.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground mt-2">por negócio fechado</p>
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        {/* ── ABA: Visitas ── */}
        <TabsContent value="visitas" className="space-y-4">

          {/* Header com botão Agendar */}
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 mr-4">
              {([
                { label: "Total",      value: listaVisitas.length,                                                  color: "text-foreground",  bg: "bg-muted/40",      statusKey: "Todos"      },
                { label: "Agendadas",  value: listaVisitas.filter((v) => v.status === "Agendada").length,           color: "text-primary",     bg: "bg-primary/5",     statusKey: "Agendada"   },
                { label: "Realizadas", value: listaVisitas.filter((v) => v.status === "Realizada").length,          color: "text-green-500",   bg: "bg-green-500/5",   statusKey: "Realizada"  },
                { label: "Canceladas", value: listaVisitas.filter((v) => v.status === "Cancelada").length,          color: "text-red-500",     bg: "bg-red-500/5",     statusKey: "Cancelada"  },
              ] as const).map((k) => (
                <div key={k.label} className={`stat-card ${k.bg} cursor-pointer border-2 transition-all ${filtroStatusVisita === k.statusKey ? "border-primary/40" : "border-transparent"}`}
                  onClick={() => setFiltroStatusVisita(k.statusKey as "Todos" | StatusVisita)}>
                  <span className="text-xs text-muted-foreground">{k.label}</span>
                  <p className={`text-3xl font-bold font-display mt-1 ${k.color}`}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Botão Agendar Visita */}
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild>
                <Button size="sm" className="whitespace-nowrap">+ Agendar Visita</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Agendar Nova Visita</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome do Cliente</Label>
                    <Input className="h-8 text-sm" placeholder="Ex: João Silva" value={novaVisita.conta}
                      onChange={(e) => setNovaVisita((p) => ({ ...p, conta: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Corretor Responsável</Label>
                    <Select value={novaVisita.corretor} onValueChange={(v) => setNovaVisita((p) => ({ ...p, corretor: v as typeof p.corretor }))}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Hans", "Rafael", "Gabriel"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Imóvel de Interesse</Label>
                    <Select value={novaVisita.imovel} onValueChange={(v) => setNovaVisita((p) => ({ ...p, imovel: v }))}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione um imóvel" /></SelectTrigger>
                      <SelectContent>
                        {imoveis.map((i) => <SelectItem key={i.id} value={i.nome}>{i.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Imóvel</Label>
                    <Select value={novaVisita.tipoImovel} onValueChange={(v) => setNovaVisita((p) => ({ ...p, tipoImovel: v as typeof p.tipoImovel }))}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Casa", "Terreno", "Apartamento"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data da Visita</Label>
                    <Input type="date" className="h-8 text-sm" value={novaVisita.dataVisita}
                      onChange={(e) => setNovaVisita((p) => ({ ...p, dataVisita: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select value={novaVisita.status} onValueChange={(v) => setNovaVisita((p) => ({ ...p, status: v as StatusVisita }))}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Agendada", "Realizada", "Cancelada", "Reagendada"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setDialogAberto(false)}>Cancelar</Button>
                  <Button size="sm" onClick={() => {
                    if (!novaVisita.conta || !novaVisita.imovel || !novaVisita.dataVisita) return;
                    const nova: Visita = {
                      id: `V${String(listaVisitas.length + 1).padStart(3, "0")}`,
                      nome: `V${String(listaVisitas.length + 1).padStart(6, "0")}`,
                      conta: novaVisita.conta,
                      corretor: novaVisita.corretor,
                      imovel: novaVisita.imovel,
                      tipoImovel: novaVisita.tipoImovel,
                      valorImovel: imoveis.find((i) => i.nome === novaVisita.imovel)?.valor ?? 0,
                      dataCriacao: new Date().toISOString().slice(0, 10),
                      dataVisita: novaVisita.dataVisita,
                      status: novaVisita.status,
                    };
                    setListaVisitas((prev) => [nova, ...prev]);
                    setNovaVisita({ conta: "", corretor: "Hans", imovel: "", tipoImovel: "Casa", dataVisita: "", status: "Agendada" });
                    setDialogAberto(false);
                  }}>Agendar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Reagendadas + Filtro corretor */}
          <div className="flex items-center gap-3">
            <div
              className={`stat-card bg-amber-500/5 cursor-pointer border-2 transition-all ${filtroStatusVisita === "Reagendada" ? "border-primary/40" : "border-transparent"} inline-flex gap-4 items-center px-4 py-2`}
              onClick={() => setFiltroStatusVisita(filtroStatusVisita === "Reagendada" ? "Todos" : "Reagendada")}
            >
              <span className="text-xs text-muted-foreground">Reagendadas</span>
              <span className="text-2xl font-bold text-amber-500">{listaVisitas.filter((v) => v.status === "Reagendada").length}</span>
            </div>
            <Select value={filtroCorretorVisita} onValueChange={(v) => setFiltroCorretorVisita(v as typeof filtroCorretorVisita)}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Corretor" /></SelectTrigger>
              <SelectContent>
                {["Todos", "Hans", "Rafael", "Gabriel"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Linha 1: Por Corretor + Por Status (gráfico) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total */}
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">Visitas por Corretor</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[160px]">
                <p className="text-8xl font-bold font-display text-primary leading-none">{listaVisitas.length}</p>
              </CardContent>
            </Card>

            {/* Por usuário */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Visitas por Corretor</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={CORRETORES.map((c) => ({ nome: c, quantidade: listaVisitas.filter((v) => v.corretor === c).length, fill: FILLS[c] }))}
                    layout="vertical" margin={{ left: 80 }}
                  >
                    <XAxis type="number" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" fontSize={11} width={75} />
                    <Tooltip formatter={(v) => [v, "Visitas"]} />
                    <Bar dataKey="quantidade" radius={[0, 5, 5, 0]}>
                      {CORRETORES.map((_, i) => <Cell key={i} fill={Object.values(FILLS)[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Linha 2: Por conta + Data de criação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visitas por conta (top 8) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Visitas por Conta (Top 8)</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const contagem: Record<string, number> = {};
                  listaVisitas.forEach((v) => { contagem[v.conta] = (contagem[v.conta] || 0) + 1; });
                  const top = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([conta, quantidade]) => ({ conta: conta.split(" ").slice(0, 2).join(" "), quantidade }));
                  return (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={top} margin={{ bottom: 30 }}>
                        <XAxis dataKey="conta" fontSize={9} interval={0} angle={-30} textAnchor="end" />
                        <YAxis fontSize={11} allowDecimals={false} />
                        <Tooltip formatter={(v) => [v, "Visitas"]} />
                        <Bar dataKey="quantidade" fill="hsl(224, 73%, 45%)" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Data de criação */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Data de Criação da Visita</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const contagem: Record<string, number> = {};
                  listaVisitas.forEach((v) => { contagem[v.dataCriacao] = (contagem[v.dataCriacao] || 0) + 1; });
                  const data = Object.entries(contagem).sort().map(([data, quantidade]) => ({ data: data.slice(5), quantidade }));
                  return (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={data} margin={{ bottom: 20 }}>
                        <XAxis dataKey="data" fontSize={10} />
                        <YAxis fontSize={11} allowDecimals={false} />
                        <Tooltip formatter={(v) => [v, "Visitas"]} />
                        <Bar dataKey="quantidade" fill="hsl(224, 73%, 45%)" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Linha 3: Imóveis mais visitados + Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Imóveis mais visitados */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Imóveis de Interesse mais Visitados</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const contagem: Record<string, number> = {};
                  listaVisitas.forEach((v) => { contagem[v.imovel] = (contagem[v.imovel] || 0) + 1; });
                  const top = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([imovel, quantidade]) => ({ imovel: imovel.split(" ").slice(0, 2).join(" "), quantidade }));
                  return (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={top} margin={{ bottom: 30 }}>
                        <XAxis dataKey="imovel" fontSize={9} interval={0} angle={-30} textAnchor="end" />
                        <YAxis fontSize={11} allowDecimals={false} />
                        <Tooltip formatter={(v) => [v, "Visitas"]} />
                        <Bar dataKey="quantidade" fill="hsl(43, 76%, 48%)" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Tipo de imóvel — rosca */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Visitas por Tipo de Imóvel</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={visitasPorTipoImovel} dataKey="quantidade" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} label={({ value }) => value}>
                      {visitasPorTipoImovel.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-1">
                  {visitasPorTipoImovel.map((e) => (
                    <span key={e.tipo} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: e.fill }} />
                      {e.tipo}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela: Visitas filtradas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Visitas {filtroStatusVisita !== "Todos" ? `— ${filtroStatusVisita}s` : ""} {filtroCorretorVisita !== "Todos" ? `· ${filtroCorretorVisita}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Visita</th>
                      <th className="text-left p-3 font-medium">Conta</th>
                      <th className="text-left p-3 font-medium">Corretor</th>
                      <th className="text-left p-3 font-medium">Imóvel</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Data Visita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaVisitas
                      .filter((v) => filtroStatusVisita  === "Todos" || v.status    === filtroStatusVisita)
                      .filter((v) => filtroCorretorVisita === "Todos" || v.corretor === filtroCorretorVisita)
                      .map((v) => (
                        <tr key={v.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-mono text-muted-foreground">{v.nome}</td>
                          <td className="p-3 font-medium">{v.conta}</td>
                          <td className="p-3">{v.corretor}</td>
                          <td className="p-3">{v.imovel}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={`text-[10px] px-1.5 ${
                              v.status === "Realizada"  ? "border-green-500 text-green-600" :
                              v.status === "Cancelada"  ? "border-red-500 text-red-600" :
                              v.status === "Reagendada" ? "border-amber-500 text-amber-600" :
                              "border-primary text-primary"
                            }`}>{v.status}</Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{v.dataVisita}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* ── ABA: Tarefas ── */}
        <TabsContent value="tarefas" className="space-y-4">

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total",        value: tarefas.length,                                               color: "text-foreground",  icon: <Circle className="h-4 w-4" /> },
              { label: "Pendentes",    value: tarefas.filter((t) => t.status === "Pendente").length,        color: "text-primary",     icon: <Clock className="h-4 w-4 text-primary" /> },
              { label: "Em andamento", value: tarefas.filter((t) => t.status === "Em andamento").length,    color: "text-amber-500",   icon: <Clock className="h-4 w-4 text-amber-500" /> },
              { label: "Atrasadas",    value: tarefas.filter((t) => t.status === "Atrasada").length,        color: "text-red-500",     icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
            ].map((k) => (
              <div key={k.label} className="stat-card">
                <div className="flex items-center gap-2 mb-1">{k.icon}<span className="text-xs text-muted-foreground">{k.label}</span></div>
                <p className={`text-3xl font-bold font-display ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <Select value={filtroCorretor} onValueChange={(v) => setFiltroCorretor(v as typeof filtroCorretor)}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Corretor" /></SelectTrigger>
              <SelectContent>
                {["Todos", "Hans", "Rafael", "Gabriel"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as typeof filtroTipo)}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                {["Todos", "Ligação", "Mensagem"].map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as typeof filtroStatus)}>
              <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {["Todos", "Pendente", "Em andamento", "Concluída", "Atrasada"].map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Tarefas */}
          <div className="space-y-2">
            {tarefas
              .filter((t) => filtroCorretor === "Todos" || t.corretor === filtroCorretor)
              .filter((t) => filtroTipo    === "Todos" || t.tipo      === filtroTipo)
              .filter((t) => filtroStatus  === "Todos" || t.status    === filtroStatus)
              .map((t) => (
                <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  {/* Ícone do tipo */}
                  <div className={`mt-0.5 p-1.5 rounded-md ${t.tipo === "Ligação" ? "bg-primary/10" : "bg-amber-500/10"}`}>
                    {t.tipo === "Ligação"
                      ? <Phone className="h-4 w-4 text-primary" />
                      : <MessageSquare className="h-4 w-4 text-amber-500" />}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{t.titulo}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                        t.status === "Concluída"   ? "border-green-500 text-green-600" :
                        t.status === "Atrasada"    ? "border-red-500 text-red-600" :
                        t.status === "Em andamento"? "border-amber-500 text-amber-600" :
                        "border-primary text-primary"
                      }`}>{t.status}</Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                        t.prioridade === "Alta"   ? "border-red-400 text-red-500" :
                        t.prioridade === "Média"  ? "border-amber-400 text-amber-500" :
                        "border-muted-foreground text-muted-foreground"
                      }`}>{t.prioridade}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.descricao}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span>👤 {t.lead}</span>
                      <span>🏠 {t.corretor}</span>
                      <span>📅 {t.dataVencimento}</span>
                    </div>
                  </div>

                  {/* Status icon */}
                  <div className="mt-0.5">
                    {t.status === "Concluída"
                      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                      : t.status === "Atrasada"
                      ? <AlertCircle className="h-5 w-5 text-red-500" />
                      : <Circle className="h-5 w-5 text-muted-foreground/40" />}
                  </div>
                </div>
              ))}
            {tarefas.filter((t) =>
              (filtroCorretor === "Todos" || t.corretor === filtroCorretor) &&
              (filtroTipo    === "Todos" || t.tipo      === filtroTipo) &&
              (filtroStatus  === "Todos" || t.status    === filtroStatus)
            ).length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhuma tarefa encontrada com esses filtros.</p>
            )}
          </div>

        </TabsContent>

      </Tabs>
    </div>
  );
}
