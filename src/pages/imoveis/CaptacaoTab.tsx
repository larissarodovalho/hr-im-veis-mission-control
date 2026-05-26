import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Search, User, Phone, Home as HomeIcon, ExternalLink, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { ESTAGIOS_CAPTACAO, EstagioCaptacao } from "@/lib/captacaoFunil";

type Captacao = {
  id: string;
  conta_id: string;
  estagio: string;
  data_agendada: string | null;
  checklist_enviado: boolean;
  checklist_observacoes: string | null;
  imovel_id: string | null;
  responsavel_id: string | null;
  observacoes: string | null;
  created_at: string;
};

type Conta = { id: string; nome: string; telefone: string | null; email: string | null };
type Imovel = { id: string; titulo: string; codigo: string | null };

function CaptacaoCard({
  c,
  conta,
  responsavelNome,
  imovel,
  onClick,
}: {
  c: Captacao;
  conta?: Conta;
  responsavelNome?: string;
  imovel?: Imovel;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: c.id });
  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`p-3 space-y-1.5 cursor-grab active:cursor-grabbing hover:border-primary/40 transition ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/crm/contas/${c.conta_id}`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="font-medium text-sm hover:underline truncate flex-1"
        >
          {conta?.nome || "—"}
        </Link>
        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
      </div>
      {conta?.telefone && (
        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Phone className="h-3 w-3" /> {conta.telefone}
        </div>
      )}
      {c.data_agendada && (
        <div className="text-[11px] text-foreground flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          {new Date(c.data_agendada).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
      {c.checklist_enviado && (
        <Badge variant="outline" className="text-[10px]">Checklist enviado</Badge>
      )}
      {imovel && (
        <Badge variant="secondary" className="text-[10px]">
          <HomeIcon className="h-3 w-3 mr-1" />
          {imovel.codigo || imovel.titulo}
        </Badge>
      )}
      {responsavelNome && (
        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" /> {responsavelNome}
        </div>
      )}
    </Card>
  );
}

function Coluna({
  estagio,
  children,
  count,
}: {
  estagio: typeof ESTAGIOS_CAPTACAO[number];
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estagio.id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border-2 border-dashed ${estagio.color} p-2 min-h-[200px] transition ${
        isOver ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wide">{estagio.label}</span>
        <Badge variant="secondary" className="text-[10px]">{count}</Badge>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function CaptacaoTab() {
  const [items, setItems] = useState<Captacao[]>([]);
  const [contas, setContas] = useState<Record<string, Conta>>({});
  const [imoveis, setImoveis] = useState<Record<string, Imovel>>({});
  const [imoveisList, setImoveisList] = useState<Imovel[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Captacao | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const { data } = await supabase
      .from("captacoes_imovel")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as Captacao[]) ?? []);
  };

  useEffect(() => {
    load();
    supabase.from("contas").select("id,nome,telefone,email").then(({ data }) => {
      const m: Record<string, Conta> = {};
      (data ?? []).forEach((c: any) => { m[c.id] = c; });
      setContas(m);
    });
    supabase.from("imoveis").select("id,titulo,codigo").then(({ data }) => {
      const m: Record<string, Imovel> = {};
      (data ?? []).forEach((i: any) => { m[i.id] = i; });
      setImoveis(m);
      setImoveisList((data as Imovel[]) ?? []);
    });
    supabase.from("profiles").select("user_id,nome").then(({ data }) => {
      const m: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { if (p.user_id) m[p.user_id] = p.nome || "Sem nome"; });
      setProfiles(m);
    });

    const ch = supabase
      .channel("captacoes-imovel")
      .on("postgres_changes", { event: "*", schema: "public", table: "captacoes_imovel" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter((c) => {
      const conta = contas[c.conta_id];
      return (
        conta?.nome?.toLowerCase().includes(s) ||
        conta?.telefone?.toLowerCase().includes(s) ||
        conta?.email?.toLowerCase().includes(s)
      );
    });
  }, [items, contas, search]);

  const byEstagio = useMemo(() => {
    const m: Record<string, Captacao[]> = {};
    ESTAGIOS_CAPTACAO.forEach((e) => { m[e.id] = []; });
    filtered.forEach((c) => { (m[c.estagio] ||= []).push(c); });
    return m;
  }, [filtered]);

  const onDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id));
  const onDragEnd = async (e: DragEndEvent) => {
    setDraggingId(null);
    if (!e.over) return;
    const id = String(e.active.id);
    const novoEstagio = String(e.over.id) as EstagioCaptacao;
    const c = items.find((i) => i.id === id);
    if (!c || c.estagio === novoEstagio) return;
    setItems(items.map((i) => i.id === id ? { ...i, estagio: novoEstagio } : i));
    const { error } = await supabase
      .from("captacoes_imovel")
      .update({ estagio: novoEstagio })
      .eq("id", id);
    if (error) { toast.error("Erro ao mover"); load(); return; }
    toast.success(`Movido para ${ESTAGIOS_CAPTACAO.find((s) => s.id === novoEstagio)?.label}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar captação..."
              className="pl-8 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="secondary">{items.filter((i) => i.estagio !== "concluido").length} ativas</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Cards criados automaticamente quando uma conta entra em "Captação/Imóvel".
        </p>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {ESTAGIOS_CAPTACAO.map((est) => (
            <Coluna key={est.id} estagio={est} count={byEstagio[est.id].length}>
              {byEstagio[est.id].map((c) => (
                <CaptacaoCard
                  key={c.id}
                  c={c}
                  conta={contas[c.conta_id]}
                  responsavelNome={c.responsavel_id ? profiles[c.responsavel_id] : undefined}
                  imovel={c.imovel_id ? imoveis[c.imovel_id] : undefined}
                  onClick={() => setEditing(c)}
                />
              ))}
              {byEstagio[est.id].length === 0 && (
                <div className="text-[11px] text-muted-foreground text-center py-6">Vazio</div>
              )}
            </Coluna>
          ))}
        </div>
      </DndContext>

      <CaptacaoDialog
        captacao={editing}
        conta={editing ? contas[editing.conta_id] : undefined}
        imoveis={imoveisList}
        open={!!editing}
        onOpenChange={(v) => { if (!v) setEditing(null); }}
        onSaved={() => { setEditing(null); load(); }}
      />
    </div>
  );
}

function CaptacaoDialog({
  captacao,
  conta,
  imoveis,
  open,
  onOpenChange,
  onSaved,
}: {
  captacao: Captacao | null;
  conta?: Conta;
  imoveis: Imovel[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [estagio, setEstagio] = useState<EstagioCaptacao>("novo");
  const [dataAgendada, setDataAgendada] = useState("");
  const [checklist, setChecklist] = useState(false);
  const [checklistObs, setChecklistObs] = useState("");
  const [imovelId, setImovelId] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!captacao) return;
    setEstagio(captacao.estagio as EstagioCaptacao);
    setDataAgendada(captacao.data_agendada ? captacao.data_agendada.slice(0, 16) : "");
    setChecklist(captacao.checklist_enviado);
    setChecklistObs(captacao.checklist_observacoes || "");
    setImovelId(captacao.imovel_id || "");
    setObservacoes(captacao.observacoes || "");
  }, [captacao]);

  const save = async () => {
    if (!captacao) return;
    setSaving(true);
    const { error } = await supabase.from("captacoes_imovel").update({
      estagio,
      data_agendada: dataAgendada ? new Date(dataAgendada).toISOString() : null,
      checklist_enviado: checklist,
      checklist_observacoes: checklistObs || null,
      imovel_id: imovelId || null,
      observacoes: observacoes || null,
    }).eq("id", captacao.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Captação atualizada");

    // Sincroniza com Google Calendar quando há data agendada
    if (dataAgendada) {
      supabase.functions.invoke("gcal-push", {
        body: { entity_type: "captacao", entity_id: captacao.id, action: "create" },
      }).catch(() => {});
    }

    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Captação · {conta?.nome || "—"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Etapa</Label>
            <Select value={estagio} onValueChange={(v) => setEstagio(v as EstagioCaptacao)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESTAGIOS_CAPTACAO.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data agendada</Label>
            <Input type="datetime-local" value={dataAgendada} onChange={(e) => setDataAgendada(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="checklist" checked={checklist} onCheckedChange={(v) => setChecklist(!!v)} />
            <Label htmlFor="checklist" className="cursor-pointer">Detalhamento/checklist enviado ao cliente</Label>
          </div>
          <div>
            <Label>Observações do detalhamento</Label>
            <Textarea
              rows={3}
              placeholder="Ex.: casa precisa estar arrumada, documentos da matrícula, etc."
              value={checklistObs}
              onChange={(e) => setChecklistObs(e.target.value)}
            />
          </div>
          <div>
            <Label>Imóvel cadastrado (ao concluir)</Label>
            <Select value={imovelId || "none"} onValueChange={(v) => setImovelId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar imóvel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Nenhum —</SelectItem>
                {imoveis.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.codigo ? `${i.codigo} · ` : ""}{i.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observações gerais</Label>
            <Textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
