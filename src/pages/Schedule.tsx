import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Phone, Video, MapPin, Plus, Ban, Sparkles, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Compromisso = {
  id: string;
  date: Date;
  end?: Date;
  tipo: "ligacao" | "presencial" | "videochamada";
  titulo: string;
  status: string;
  local?: string | null;
  link?: string | null;
  notas?: string | null;
  lead_nome?: string | null;
  criado_por_ia?: boolean;
};

type Bloqueio = {
  id: string;
  inicio: Date;
  fim: Date;
  motivo: string | null;
  dia_inteiro: boolean;
  created_by: string | null;
};

const TIPO_LABEL: Record<Compromisso["tipo"], string> = {
  ligacao: "Ligação",
  presencial: "Presencial",
  videochamada: "Videochamada",
};

const TipoIcon = ({ tipo }: { tipo: Compromisso["tipo"] }) => {
  if (tipo === "ligacao") return <Phone className="h-4 w-4" />;
  if (tipo === "videochamada") return <Video className="h-4 w-4" />;
  return <MapPin className="h-4 w-4" />;
};

export default function Schedule() {
  const { user } = useAuth();
  const [reunioes, setReunioes] = useState<Compromisso[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [openNovo, setOpenNovo] = useState(false);
  const [openBloqueio, setOpenBloqueio] = useState(false);

  const [novo, setNovo] = useState({
    tipo: "presencial" as Compromisso["tipo"],
    titulo: "",
    agendada_para: "",
    duracao_min: 60,
    lead_id: "none",
    local: "",
    link: "",
    notas: "",
  });

  const [bloq, setBloq] = useState({
    inicio: "",
    fim: "",
    motivo: "",
    dia_inteiro: false,
  });

  const load = async () => {
    const [{ data: r }, { data: b }, { data: l }] = await Promise.all([
      supabase.from("reunioes")
        .select("id, agendada_para, status, local, link, notas, tipo, duracao_min, titulo, criado_por_ia, leads(nome)")
        .order("agendada_para"),
      supabase.from("agenda_bloqueios" as any).select("*").order("inicio"),
      supabase.from("leads").select("id, nome").order("nome"),
    ]);
    setReunioes(((r ?? []) as any[]).map((m) => {
      const start = new Date(m.agendada_para);
      const end = new Date(start.getTime() + (m.duracao_min ?? 60) * 60000);
      return {
        id: m.id,
        date: start,
        end,
        tipo: (m.tipo ?? "presencial") as Compromisso["tipo"],
        titulo: m.titulo || m.leads?.nome || "Compromisso",
        status: m.status,
        local: m.local,
        link: m.link,
        notas: m.notas,
        lead_nome: m.leads?.nome,
        criado_por_ia: m.criado_por_ia,
      };
    }));
    setBloqueios(((b ?? []) as any[]).map((x) => ({
      id: x.id,
      inicio: new Date(x.inicio),
      fim: new Date(x.fim),
      motivo: x.motivo,
      dia_inteiro: x.dia_inteiro,
      created_by: x.created_by,
    })));
    setLeads(l ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("agenda-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reunioes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "agenda_bloqueios" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const allDayDates = useMemo(() => [
    ...reunioes.map((r) => r.date),
    ...bloqueios.map((b) => b.inicio),
  ], [reunioes, bloqueios]);

  const eventosDoDia = useMemo(() => {
    if (!selected) return { compromissos: [] as Compromisso[], bloqueios: [] as Bloqueio[] };
    return {
      compromissos: reunioes.filter((r) => isSameDay(r.date, selected)),
      bloqueios: bloqueios.filter((b) =>
        isSameDay(b.inicio, selected) ||
        isSameDay(b.fim, selected) ||
        (b.inicio < selected && b.fim > selected)
      ),
    };
  }, [reunioes, bloqueios, selected]);

  const checkConflito = (start: Date, end: Date): { conflito: boolean; razao?: string } => {
    for (const b of bloqueios) {
      if (start < b.fim && end > b.inicio) {
        return { conflito: true, razao: `Bloqueio: ${b.motivo || "horário indisponível"}` };
      }
    }
    for (const r of reunioes) {
      const rEnd = r.end ?? new Date(r.date.getTime() + 60 * 60000);
      if (start < rEnd && end > r.date) {
        return { conflito: true, razao: `Conflita com: ${r.titulo} (${TIPO_LABEL[r.tipo]})` };
      }
    }
    return { conflito: false };
  };

  const criarCompromisso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novo.titulo || !novo.agendada_para) return toast.error("Preencha título e data/hora");
    const start = new Date(novo.agendada_para);
    const end = new Date(start.getTime() + novo.duracao_min * 60000);
    const c = checkConflito(start, end);
    if (c.conflito) return toast.error(c.razao!);

    const { error } = await supabase.from("reunioes").insert({
      agendada_para: start.toISOString(),
      tipo: novo.tipo,
      duracao_min: novo.duracao_min,
      titulo: novo.titulo,
      lead_id: novo.lead_id === "none" ? null : novo.lead_id,
      local: novo.tipo === "presencial" ? novo.local || null : null,
      link: novo.tipo === "videochamada" ? novo.link || null : null,
      notas: novo.notas || null,
      created_by: user?.id,
      corretor_id: user?.id,
      status: "agendada",
    } as any);
    if (error) return toast.error(error.message);
    toast.success("Compromisso criado");
    setNovo({ tipo: "presencial", titulo: "", agendada_para: "", duracao_min: 60, lead_id: "none", local: "", link: "", notas: "" });
    setOpenNovo(false);
    load();
  };

  const criarBloqueio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloq.inicio || !bloq.fim) return toast.error("Informe início e fim");
    const inicio = new Date(bloq.inicio);
    const fim = new Date(bloq.fim);
    if (fim <= inicio) return toast.error("Fim deve ser posterior ao início");
    const { error } = await supabase.from("agenda_bloqueios" as any).insert({
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      motivo: bloq.motivo || null,
      dia_inteiro: bloq.dia_inteiro,
      created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Bloqueio criado");
    setBloq({ inicio: "", fim: "", motivo: "", dia_inteiro: false });
    setOpenBloqueio(false);
    load();
  };

  const removerBloqueio = async (id: string) => {
    const { error } = await supabase.from("agenda_bloqueios" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Bloqueio removido");
    load();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold flex items-center gap-2">
            <CalendarIcon className="h-7 w-7" /> Agenda
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compartilhada com a equipe • integrada ao WhatsApp e à captação automática com IA.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={openBloqueio} onOpenChange={setOpenBloqueio}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Ban className="h-4 w-4 mr-1" />Bloquear horário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Bloquear horário</DialogTitle></DialogHeader>
              <form onSubmit={criarBloqueio} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Início</Label>
                    <Input type="datetime-local" value={bloq.inicio} onChange={(e) => setBloq({ ...bloq, inicio: e.target.value })} />
                  </div>
                  <div>
                    <Label>Fim</Label>
                    <Input type="datetime-local" value={bloq.fim} onChange={(e) => setBloq({ ...bloq, fim: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Motivo</Label>
                  <Input placeholder="Folga, almoço, feriado..." value={bloq.motivo} onChange={(e) => setBloq({ ...bloq, motivo: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenBloqueio(false)}>Cancelar</Button>
                  <Button type="submit">Bloquear</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openNovo} onOpenChange={setOpenNovo}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo compromisso</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo compromisso</DialogTitle></DialogHeader>
              <form onSubmit={criarCompromisso} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={novo.tipo} onValueChange={(v) => setNovo({ ...novo, tipo: v as Compromisso["tipo"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ligacao">📞 Ligação</SelectItem>
                        <SelectItem value="presencial">📍 Presencial</SelectItem>
                        <SelectItem value="videochamada">🎥 Videochamada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duração (min)</Label>
                    <Input type="number" min={15} step={15} value={novo.duracao_min} onChange={(e) => setNovo({ ...novo, duracao_min: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <Label>Título</Label>
                  <Input value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} placeholder="Ex.: Visita ao apartamento Centro" />
                </div>
                <div>
                  <Label>Data e hora</Label>
                  <Input type="datetime-local" value={novo.agendada_para} onChange={(e) => setNovo({ ...novo, agendada_para: e.target.value })} />
                </div>
                <div>
                  <Label>Lead vinculado</Label>
                  <Select value={novo.lead_id} onValueChange={(v) => setNovo({ ...novo, lead_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem lead vinculado</SelectItem>
                      {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {novo.tipo === "presencial" && (
                  <div>
                    <Label>Local</Label>
                    <Input value={novo.local} onChange={(e) => setNovo({ ...novo, local: e.target.value })} placeholder="Endereço" />
                  </div>
                )}
                {novo.tipo === "videochamada" && (
                  <div>
                    <Label>Link da chamada</Label>
                    <Input value={novo.link} onChange={(e) => setNovo({ ...novo, link: e.target.value })} placeholder="Google Meet, Zoom..." />
                  </div>
                )}
                <div>
                  <Label>Notas</Label>
                  <Textarea value={novo.notas} onChange={(e) => setNovo({ ...novo, notas: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
                  <Button type="submit">Agendar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        <Card className="p-4">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            locale={ptBR}
            modifiers={{
              hasEvent: reunioes.map((r) => r.date),
              blocked: bloqueios.flatMap((b) => {
                const days: Date[] = [];
                const cur = new Date(b.inicio); cur.setHours(0,0,0,0);
                const end = new Date(b.fim);
                while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate()+1); }
                return days;
              }),
            }}
            modifiersClassNames={{
              hasEvent: "relative font-semibold text-primary after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
              blocked: "line-through opacity-60 bg-destructive/10",
            }}
            className={cn("p-3 pointer-events-auto rounded-md border")}
          />
        </Card>

        <Card className="p-4 md:p-6 min-w-0">
          <Tabs defaultValue="dia">
            <TabsList>
              <TabsTrigger value="dia">Dia selecionado</TabsTrigger>
              <TabsTrigger value="proximos">Próximos</TabsTrigger>
              <TabsTrigger value="bloqueios">Bloqueios ({bloqueios.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="dia" className="space-y-3 mt-4">
              <div className="text-sm text-muted-foreground">
                {selected ? format(selected, "PPPP", { locale: ptBR }) : "Selecione um dia"}
              </div>

              {eventosDoDia.bloqueios.length > 0 && (
                <div className="space-y-2">
                  {eventosDoDia.bloqueios.map((b) => (
                    <div key={b.id} className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium flex items-center gap-2"><Ban className="h-4 w-4" />{b.motivo || "Indisponível"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {format(b.inicio, "Pp", { locale: ptBR })} → {format(b.fim, "Pp", { locale: ptBR })}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removerBloqueio(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {eventosDoDia.compromissos.length === 0 && eventosDoDia.bloqueios.length === 0 && (
                <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-md">
                  Nada agendado neste dia.
                </div>
              )}

              <ul className="space-y-2">
                {eventosDoDia.compromissos
                  .sort((a, b) => +a.date - +b.date)
                  .map((c) => (
                    <li key={c.id} className="rounded-md border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium flex items-center gap-2">
                            <TipoIcon tipo={c.tipo} />
                            {format(c.date, "HH:mm", { locale: ptBR })} — {c.titulo}
                            {c.criado_por_ia && (
                              <Badge variant="secondary" className="gap-1">
                                <Sparkles className="h-3 w-3" /> IA
                              </Badge>
                            )}
                          </div>
                          {c.lead_nome && <div className="text-xs text-muted-foreground mt-0.5">Lead: {c.lead_nome}</div>}
                          {(c.local || c.link) && <div className="text-xs text-muted-foreground mt-0.5">{c.local || c.link}</div>}
                          {c.notas && <div className="text-xs text-muted-foreground mt-1">{c.notas}</div>}
                        </div>
                        <Badge variant="outline">{c.status}</Badge>
                      </div>
                    </li>
                  ))}
              </ul>
            </TabsContent>

            <TabsContent value="proximos" className="space-y-2 max-h-[36rem] overflow-auto mt-4">
              {reunioes.filter((r) => r.date >= new Date()).length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum compromisso futuro.</p>
              )}
              {reunioes
                .filter((r) => r.date >= new Date())
                .map((c) => (
                  <div key={c.id} className="rounded-md border p-3 text-sm flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <TipoIcon tipo={c.tipo} />
                        {format(c.date, "Pp", { locale: ptBR })} — {c.titulo}
                        {c.criado_por_ia && <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" />IA</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {TIPO_LABEL[c.tipo]} · {c.lead_nome || "sem lead"}{c.local || c.link ? ` · ${c.local || c.link}` : ""}
                      </div>
                    </div>
                    <Badge variant="outline">{c.status}</Badge>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="bloqueios" className="space-y-2 mt-4">
              {bloqueios.length === 0 && <p className="text-sm text-muted-foreground">Nenhum bloqueio cadastrado.</p>}
              {bloqueios.map((b) => (
                <div key={b.id} className="rounded-md border p-3 text-sm flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium flex items-center gap-2"><Ban className="h-4 w-4" />{b.motivo || "Indisponível"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {format(b.inicio, "Pp", { locale: ptBR })} → {format(b.fim, "Pp", { locale: ptBR })}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removerBloqueio(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
