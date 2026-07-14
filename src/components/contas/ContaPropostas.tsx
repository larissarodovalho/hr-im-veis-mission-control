import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Pencil, Trash2, Save, CalendarIcon, CheckCircle2, XCircle, Clock, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { useRole } from "@/hooks/useRole";

type Proposta = {
  id: string;
  conta_id: string;
  data_proposta: string;
  valor: number | null;
  status: "pendente" | "aceita" | "recusada";
  descricao: string | null;
  corretor_id: string | null;
  created_by: string | null;
  imovel_id: string | null;
  created_at: string;
};

type ImovelLite = { id: string; codigo: string | null; titulo: string | null };

const schema = z.object({
  data_proposta: z.date({ required_error: "Data obrigatória" }),
  valor: z.number().min(0).nullable().optional(),
  status: z.enum(["pendente", "aceita", "recusada"]),
  descricao: z.string().trim().max(2000).nullable().optional(),
  imovel_id: z.string().uuid().nullable().optional(),
});

const STATUS_META: Record<Proposta["status"], { label: string; badge: string; icon: JSX.Element }> = {
  pendente: {
    label: "Pendente",
    badge: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    icon: <Clock className="h-3 w-3 mr-1" />,
  },
  aceita: {
    label: "Aceita",
    badge: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
  },
  recusada: {
    label: "Recusada",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    icon: <XCircle className="h-3 w-3 mr-1" />,
  },
};

export default function ContaPropostas({ contaId }: { contaId: string }) {
  const { isAdmin } = useRole();
  const [items, setItems] = useState<Proposta[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState<(Partial<Proposta> & { _date?: Date }) | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data }, { data: { user } }] = await Promise.all([
      supabase
        .from("conta_propostas" as any)
        .select("*")
        .eq("conta_id", contaId)
        .order("data_proposta", { ascending: false }),
      supabase.auth.getUser(),
    ]);
    setItems(((data as any) ?? []) as Proposta[]);
    setUserId(user?.id ?? null);
  };

  useEffect(() => {
    load();
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.contaId === contaId) openNew();
    };
    window.addEventListener("conta:proposta:new", handler);
    return () => window.removeEventListener("conta:proposta:new", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contaId]);

  const openNew = () =>
    setEditing({ _date: new Date(), status: "pendente", valor: null, descricao: "" });
  const openEdit = (p: Proposta) =>
    setEditing({ ...p, _date: new Date(p.data_proposta + "T00:00:00") });

  const save = async () => {
    if (!editing) return;
    const parsed = schema.safeParse({
      data_proposta: editing._date,
      valor: editing.valor != null && editing.valor !== ("" as any) ? Number(editing.valor) : null,
      status: (editing.status ?? "pendente") as Proposta["status"],
      descricao: editing.descricao?.toString().trim() || null,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");

    setSaving(true);
    const payload: any = {
      conta_id: contaId,
      data_proposta: format(parsed.data.data_proposta, "yyyy-MM-dd"),
      valor: parsed.data.valor,
      status: parsed.data.status,
      descricao: parsed.data.descricao,
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("conta_propostas" as any).update(payload).eq("id", editing.id));
    } else {
      payload.created_by = userId;
      payload.corretor_id = userId;
      ({ error } = await supabase.from("conta_propostas" as any).insert(payload));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Proposta salva");
    setEditing(null);
    load();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir esta proposta?")) return;
    const { error } = await supabase.from("conta_propostas" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const alterarStatus = async (p: Proposta, novo: Proposta["status"]) => {
    if (p.status === novo) return;
    const { error } = await supabase
      .from("conta_propostas" as any)
      .update({ status: novo })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((i) => (i.id === p.id ? { ...i, status: novo } : i)));
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Propostas
          <Badge variant="secondary" className="ml-1 text-[10px]">{items.length}</Badge>
        </h3>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Registrar proposta
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhuma proposta registrada ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => {
            const canEdit = isAdmin || p.created_by === userId || p.corretor_id === userId;
            const meta = STATUS_META[p.status];
            return (
              <div key={p.id} className="flex items-start justify-between gap-3 border rounded-md p-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-muted/50">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {format(new Date(p.data_proposta + "T00:00:00"), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </Badge>
                    <Badge variant="outline" className={meta.badge}>
                      {meta.icon}
                      {meta.label}
                    </Badge>
                    {p.valor != null && (
                      <span className="font-semibold text-primary">{formatBRL(Number(p.valor))}</span>
                    )}
                  </div>
                  {p.descricao && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.descricao}</p>
                  )}
                  {canEdit && p.status === "pendente" && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => alterarStatus(p, "aceita")}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Marcar aceita
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => alterarStatus(p, "recusada")}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Marcar recusada
                      </Button>
                    </div>
                  )}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => excluir(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar proposta" : "Registrar proposta"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Data da proposta *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !editing._date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editing._date ? format(editing._date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editing._date}
                      onSelect={(d) => setEditing({ ...editing, _date: d ?? undefined })}
                      initialFocus
                      locale={ptBR}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editing.valor ?? ""}
                    onChange={(e) => setEditing({ ...editing, valor: e.target.value === "" ? null : (Number(e.target.value) as any) })}
                    placeholder="Ex: 1500000"
                  />
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select
                    value={(editing.status ?? "pendente") as string}
                    onValueChange={(v) => setEditing({ ...editing, status: v as Proposta["status"] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="aceita">Aceita</SelectItem>
                      <SelectItem value="recusada">Recusada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição / condições</Label>
                <Textarea
                  rows={5}
                  maxLength={2000}
                  value={editing.descricao ?? ""}
                  onChange={(e) => setEditing({ ...editing, descricao: e.target.value })}
                  placeholder="Detalhes da proposta, valores, condições de pagamento, prazos…"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
