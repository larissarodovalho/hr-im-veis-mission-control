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
import { Plus, Trophy, Pencil, Trash2, Save, CalendarIcon, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { useRole } from "@/hooks/useRole";

type Fechamento = {
  id: string;
  conta_id: string;
  data_fechamento: string;
  valor: number | null;
  imovel_id: string | null;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
};

type Imovel = { id: string; codigo: string | null; titulo: string | null };

const schema = z.object({
  data_fechamento: z.date({ required_error: "Data obrigatória" }),
  valor: z.number().min(0).nullable().optional(),
  imovel_id: z.string().uuid().nullable().optional(),
  observacoes: z.string().trim().max(2000).nullable().optional(),
});

export default function ContaFechamentos({ contaId }: { contaId: string }) {
  const { isAdmin } = useRole();
  const [items, setItems] = useState<Fechamento[]>([]);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Fechamento> & { _date?: Date } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data }, { data: im }, { data: { user } }] = await Promise.all([
      supabase
        .from("conta_fechamentos" as any)
        .select("*")
        .eq("conta_id", contaId)
        .order("data_fechamento", { ascending: false }),
      supabase.from("imoveis").select("id, codigo, titulo").order("codigo"),
      supabase.auth.getUser(),
    ]);
    setItems(((data as any) ?? []) as Fechamento[]);
    setImoveis((im as any) ?? []);
    setUserId(user?.id ?? null);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contaId]);

  const openNew = () => setEditing({ _date: new Date() });
  const openEdit = (f: Fechamento) =>
    setEditing({ ...f, _date: new Date(f.data_fechamento + "T00:00:00") });

  const save = async () => {
    if (!editing) return;
    const parsed = schema.safeParse({
      data_fechamento: editing._date,
      valor: editing.valor != null && editing.valor !== ("" as any) ? Number(editing.valor) : null,
      imovel_id: editing.imovel_id || null,
      observacoes: editing.observacoes?.toString().trim() || null,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");

    setSaving(true);
    const payload: any = {
      conta_id: contaId,
      data_fechamento: format(parsed.data.data_fechamento, "yyyy-MM-dd"),
      valor: parsed.data.valor,
      imovel_id: parsed.data.imovel_id,
      observacoes: parsed.data.observacoes,
    };
    let error;
    if (editing.id) {
      ({ error } = await supabase.from("conta_fechamentos" as any).update(payload).eq("id", editing.id));
    } else {
      payload.created_by = userId;
      ({ error } = await supabase.from("conta_fechamentos" as any).insert(payload));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Fechamento salvo");
    setEditing(null);
    load();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir este fechamento?")) return;
    const { error } = await supabase.from("conta_fechamentos" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const imovelLabel = (id: string | null) => {
    if (!id) return null;
    const im = imoveis.find((x) => x.id === id);
    if (!im) return "Imóvel";
    return [im.codigo, im.titulo].filter(Boolean).join(" · ");
  };

  const total = items.reduce((s, i) => s + (Number(i.valor) || 0), 0);

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> Negócios fechados
          <Badge variant="secondary" className="ml-1 text-[10px]">{items.length}</Badge>
        </h3>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{formatBRL(total)}</span>
            </span>
          )}
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Registrar
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum negócio fechado registrado ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((f) => {
            const canEdit = isAdmin || f.created_by === userId;
            return (
              <div key={f.id} className="flex items-start justify-between gap-3 border rounded-md p-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {format(new Date(f.data_fechamento + "T00:00:00"), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </Badge>
                    {f.valor != null && (
                      <span className="font-semibold text-primary">{formatBRL(Number(f.valor))}</span>
                    )}
                    {f.imovel_id && (
                      <Badge variant="outline" className="text-[11px]">
                        <Building2 className="h-3 w-3 mr-1" />
                        {imovelLabel(f.imovel_id)}
                      </Badge>
                    )}
                  </div>
                  {f.observacoes && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{f.observacoes}</p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(f)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => excluir(f.id)}>
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
            <DialogTitle>{editing?.id ? "Editar fechamento" : "Registrar fechamento"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Data do fechamento *</Label>
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
              <div>
                <Label>Valor do negócio (R$)</Label>
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
                <Label>Imóvel vinculado</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editing.imovel_id ?? ""}
                  onChange={(e) => setEditing({ ...editing, imovel_id: e.target.value || null })}
                >
                  <option value="">— Nenhum —</option>
                  {imoveis.map((im) => (
                    <option key={im.id} value={im.id}>
                      {[im.codigo, im.titulo].filter(Boolean).join(" · ") || "Sem título"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  rows={4}
                  maxLength={2000}
                  value={editing.observacoes ?? ""}
                  onChange={(e) => setEditing({ ...editing, observacoes: e.target.value })}
                  placeholder="Detalhes do negócio, condições, próximos passos…"
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
