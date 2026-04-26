import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { STAGES, SOURCES, INTERESTS, TEMPERATURES, daysSince, slaColor, slaLabel, initials, Stage, Temperature } from "@/lib/leads";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, MessageSquare, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { findDuplicates, onlyDigits, normEmail, DuplicateMatch } from "@/lib/duplicates";
import DuplicateAlert from "@/components/DuplicateAlert";

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState<any>(null);
  const [interacoes, setInteracoes] = useState<any[]>([]);
  const [reunioes, setReunioes] = useState<any[]>([]);
  const [conta, setConta] = useState<any>(null);
  const [interaction, setInteraction] = useState({ tipo: "ligacao", resultado: "", descricao: "", proxima_acao: "" });
  const [meeting, setMeeting] = useState({ agendada_para: "", local: "", link: "", notas: "" });
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertForm, setConvertForm] = useState<any>(null);
  const [converting, setConverting] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: l } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    setLead(l);
    const { data: ints } = await supabase.from("interacoes").select("*").eq("lead_id", id).order("created_at", { ascending: false });
    setInteracoes(ints ?? []);
    const { data: ms } = await supabase.from("reunioes").select("*").eq("lead_id", id).order("agendada_para", { ascending: false });
    setReunioes(ms ?? []);
    const { data: acc } = await supabase.from("contas").select("id, nome").eq("lead_id_origem", id).maybeSingle();
    setConta(acc ?? null);
  };

  useEffect(() => { load(); }, [id]);
  if (!lead) return <div className="p-8 text-muted-foreground">Carregando…</div>;
  const d = daysSince(lead.ultima_interacao ?? lead.created_at);

  const updateLead = async (patch: any) => {
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const addInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("interacoes").insert({
      lead_id: id!, tipo: interaction.tipo, descricao: interaction.descricao,
      proxima_acao: interaction.proxima_acao, resultado: interaction.resultado || null,
      created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    await supabase.from("leads").update({ ultima_interacao: new Date().toISOString() }).eq("id", id);
    setInteraction({ tipo: "ligacao", resultado: "", descricao: "", proxima_acao: "" });
    toast.success("Interação registrada");
    load();
  };

  const addMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting.agendada_para) return toast.error("Data obrigatória");
    const { error } = await supabase.from("reunioes").insert({
      lead_id: id!,
      agendada_para: new Date(meeting.agendada_para).toISOString(),
      local: meeting.local || null, link: meeting.link || null, notas: meeting.notas || null,
      created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    setMeeting({ agendada_para: "", local: "", link: "", notas: "" });
    toast.success("Reunião agendada");
    load();
  };

  const openConvert = async () => {
    const { data: existing } = await supabase.from("contas").select("id, nome").eq("lead_id_origem", lead.id).maybeSingle();
    if (existing) { toast.info(`Já convertido: ${existing.nome}`); navigate("/app/contas"); return; }
    setConvertForm({
      nome: lead.nome, email: lead.email ?? "", telefone: lead.telefone ?? "",
      endereco: lead.regiao ?? "", tipo: "PF", documento: "", observacoes: lead.observacoes ?? "",
    });
    setConvertOpen(true);
  };

  const confirmConvert = async () => {
    if (!convertForm.nome?.trim()) return toast.error("Nome obrigatório");
    setConverting(true);
    const { data: created, error } = await supabase.from("contas").insert({
      lead_id_origem: lead.id,
      nome: convertForm.nome.trim(),
      email: convertForm.email?.trim() || null,
      telefone: convertForm.telefone?.trim() || null,
      endereco: convertForm.endereco?.trim() || null,
      tipo: convertForm.tipo,
      documento: convertForm.documento?.trim() || null,
      observacoes: convertForm.observacoes?.trim() || null,
      created_by: user?.id,
      responsavel_id: user?.id,
    }).select("id").single();
    setConverting(false);
    if (error) return toast.error(error.message);
    setConvertOpen(false);
    toast.success("Lead convertido em conta!");
    navigate(created?.id ? `/app/contas/${created.id}` : "/app/contas");
  };

  return (
    <div className="p-8 space-y-6">
      <Link to="/app/leads" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-xl font-semibold">{initials(lead.nome)}</div>
          <div>
            <h1 className="font-display text-3xl font-semibold">{lead.nome}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {lead.origem && <Badge variant="secondary">{SOURCES[lead.origem]?.emoji} {SOURCES[lead.origem]?.label || lead.origem}</Badge>}
              <Badge className={slaColor(d) + " border"}>{slaLabel(d)} sem contato</Badge>
              {lead.imovel_interesse && <Badge variant="outline">{INTERESTS[lead.imovel_interesse] || lead.imovel_interesse}</Badge>}
              {lead.temperatura && <Badge className={TEMPERATURES[lead.temperatura as Temperature].className + " border"}>{TEMPERATURES[lead.temperatura as Temperature].emoji} {TEMPERATURES[lead.temperatura as Temperature].label}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {conta ? (
            <Link to={`/app/contas/${conta.id}`}>
              <Badge className="bg-success/15 text-success border-success/30 border gap-1 py-1.5 px-3"><Building2 className="h-3.5 w-3.5" /> Convertido em conta</Badge>
            </Link>
          ) : (
            <Button size="sm" onClick={openConvert} className="bg-success hover:bg-success/90 text-success-foreground">
              <Building2 className="h-4 w-4 mr-1" /> Converter em conta
            </Button>
          )}
          <Select value={lead.temperatura ?? "none"} onValueChange={v => updateLead({ temperatura: v === "none" ? null : v })}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Temperatura" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem temperatura</SelectItem>
              {(Object.keys(TEMPERATURES) as Temperature[]).map(t => (
                <SelectItem key={t} value={t}>{TEMPERATURES[t].emoji} {TEMPERATURES[t].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lead.etapa_funil} onValueChange={v => updateLead({ etapa_funil: v as Stage })}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>{STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Converter lead em conta</DialogTitle></DialogHeader>
          {convertForm && (
            <div className="space-y-3">
              <div><Label>Nome do cliente*</Label><Input value={convertForm.nome} onChange={e => setConvertForm({ ...convertForm, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Telefone</Label><Input value={convertForm.telefone} onChange={e => setConvertForm({ ...convertForm, telefone: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={convertForm.email} onChange={e => setConvertForm({ ...convertForm, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tipo</Label>
                  <Select value={convertForm.tipo} onValueChange={v => setConvertForm({ ...convertForm, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>CPF/CNPJ</Label><Input value={convertForm.documento} onChange={e => setConvertForm({ ...convertForm, documento: e.target.value })} /></div>
              </div>
              <div><Label>Endereço</Label><Input value={convertForm.endereco} onChange={e => setConvertForm({ ...convertForm, endereco: e.target.value })} /></div>
              <div><Label>Observações</Label><Textarea rows={3} value={convertForm.observacoes} onChange={e => setConvertForm({ ...convertForm, observacoes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)} disabled={converting}>Cancelar</Button>
            <Button onClick={confirmConvert} disabled={converting} className="bg-success hover:bg-success/90 text-success-foreground">
              {converting ? "Convertendo…" : "Converter em conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 space-y-3">
          <h3 className="font-display text-lg font-semibold">Contato</h3>
          {lead.telefone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{lead.telefone}</div>}
          {lead.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{lead.email}</div>}
          {lead.regiao && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" />{lead.regiao}</div>}
          <div className="pt-2"><Label className="text-xs">Observações</Label>
            <Textarea defaultValue={lead.observacoes ?? ""} onBlur={e => e.target.value !== lead.observacoes && updateLead({ observacoes: e.target.value })} rows={4} />
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2 space-y-4">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" />Registrar interação</h3>
          <form onSubmit={addInteraction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo</Label>
                <Select value={interaction.tipo} onValueChange={v => setInteraction({ ...interaction, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ligacao">Ligação</SelectItem>
                    <SelectItem value="mensagem">Mensagem</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="nota">Nota</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Resultado</Label>
                <Select value={interaction.resultado} onValueChange={v => setInteraction({ ...interaction, resultado: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atendeu">Atendeu</SelectItem>
                    <SelectItem value="nao_atendeu">Não atendeu</SelectItem>
                    <SelectItem value="retornar">Retornar</SelectItem>
                    <SelectItem value="interessado">Interessado</SelectItem>
                    <SelectItem value="sem_interesse">Sem interesse</SelectItem>
                    <SelectItem value="agendou">Agendou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Descrição</Label><Textarea value={interaction.descricao} onChange={e => setInteraction({ ...interaction, descricao: e.target.value })} rows={2} /></div>
            <div><Label>Próxima ação</Label><Input value={interaction.proxima_acao} onChange={e => setInteraction({ ...interaction, proxima_acao: e.target.value })} /></div>
            <Button type="submit" size="sm"><Plus className="h-4 w-4 mr-1" />Registrar</Button>
          </form>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><Calendar className="h-5 w-5" />Agendar reunião</h3>
          <form onSubmit={addMeeting} className="space-y-3">
            <div><Label>Data e hora*</Label><Input type="datetime-local" value={meeting.agendada_para} onChange={e => setMeeting({ ...meeting, agendada_para: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Local</Label><Input value={meeting.local} onChange={e => setMeeting({ ...meeting, local: e.target.value })} /></div>
              <div><Label>Link</Label><Input value={meeting.link} onChange={e => setMeeting({ ...meeting, link: e.target.value })} placeholder="Meet, Zoom…" /></div>
            </div>
            <div><Label>Notas</Label><Textarea value={meeting.notas} onChange={e => setMeeting({ ...meeting, notas: e.target.value })} rows={2} /></div>
            <Button type="submit" size="sm"><Plus className="h-4 w-4 mr-1" />Agendar</Button>
          </form>
          <div className="mt-4 space-y-2">
            {reunioes.map(m => (
              <div key={m.id} className="text-sm border rounded-md p-2">
                <div className="font-medium">{format(new Date(m.agendada_para), "Pp", { locale: ptBR })}</div>
                <div className="text-muted-foreground text-xs">{m.local || m.link} · <Badge variant="outline" className="text-[10px]">{m.status}</Badge></div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold mb-3">Histórico</h3>
          <div className="space-y-3 max-h-96 overflow-auto">
            {interacoes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma interação ainda.</p>}
            {interacoes.map(i => (
              <div key={i.id} className="border-l-2 border-primary/30 pl-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-[10px]">{i.tipo}</Badge>
                  {i.resultado && <span className="text-xs text-muted-foreground">{i.resultado}</span>}
                  <span className="text-xs text-muted-foreground ml-auto">{format(new Date(i.created_at), "Pp", { locale: ptBR })}</span>
                </div>
                {i.descricao && <p className="text-sm mt-1">{i.descricao}</p>}
                {i.proxima_acao && <p className="text-xs text-primary mt-1">→ {i.proxima_acao}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
