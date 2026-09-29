import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PauseCircle, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const PRAZOS = [7, 15, 30, 60];

export function StandbyBadge({ ate, className = "" }: { ate?: string | null; className?: string }) {
  if (!ate) return null;
  const vencido = new Date(ate).getTime() < Date.now();
  return (
    <Badge
      variant="outline"
      className={`${vencido ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-sky-500/15 text-sky-700 border-sky-500/30"} ${className}`}
      title="Cliente em standby — retomar contato no prazo"
    >
      <PauseCircle className="h-3 w-3 mr-1" />
      {vencido ? "Standby vencido" : `Standby até ${format(new Date(ate), "dd/MM")}`}
    </Badge>
  );
}

interface Props {
  tipo: "conta" | "oportunidade";
  id: string;
  contaId?: string | null;
  responsavelId?: string | null;
  standbyAte?: string | null;
  onChange?: () => void;
}

export default function StandbyControl({ tipo, id, contaId, responsavelId, standbyAte, onChange }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [dias, setDias] = useState<number | null>(15);
  const [data, setData] = useState("");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const tabela = tipo === "conta" ? "contas" : "oportunidades";

  const dataFinal = (): Date | null => {
    if (dias) { const d = new Date(); d.setDate(d.getDate() + dias); d.setHours(9, 0, 0, 0); return d; }
    if (data) return new Date(`${data}T09:00:00-04:00`);
    return null;
  };

  const confirmar = async () => {
    const ate = dataFinal();
    if (!ate || ate.getTime() <= Date.now()) return toast.error("Escolha um prazo futuro");
    setSaving(true);
    const agora = new Date().toISOString();
    const { error } = await supabase.from(tabela).update({
      standby_ate: ate.toISOString(), standby_desde: agora, standby_motivo: motivo.trim() || null, standby_por: user?.id ?? null,
    } as any).eq("id", id);
    if (error) { setSaving(false); return toast.error(error.message); }
    if (tipo === "conta") {
      await supabase.from("contas").update({ proxima_acao_em: ate.toISOString() } as any).eq("id", id);
    } else if (contaId) {
      await supabase.from("contas").update({ proxima_acao_em: ate.toISOString() } as any).eq("id", contaId);
    }
    await supabase.from("tarefas").update({ status: "Concluída" } as any)
      .eq(tipo === "conta" ? "conta_id" : "oportunidade_id", id).eq("origem", "standby").neq("status", "Concluída");
    const { error: tErr } = await supabase.from("tarefas").insert({
      titulo: "Retomar contato — standby",
      descricao: motivo.trim() || "Cliente pediu para retomar o contato nesta data.",
      prazo: ate.toISOString(),
      prioridade: "Alta",
      status: "A fazer",
      responsavel_id: responsavelId || user?.id || null,
      created_by: user?.id,
      origem: "standby",
      ...(tipo === "conta" ? { conta_id: id } : { oportunidade_id: id, conta_id: contaId ?? null }),
    } as any);
    setSaving(false);
    if (tErr) toast.error("Standby salvo, mas a tarefa falhou: " + tErr.message);
    else toast.success(`Em standby até ${format(ate, "dd/MM/yyyy")} — tarefa de retomada criada`);
    setOpen(false); setMotivo("");
    onChange?.();
  };

  const retomar = async () => {
    const { error } = await supabase.from(tabela).update({ standby_ate: null, standby_desde: null, standby_motivo: null, standby_por: null } as any).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("tarefas").update({ status: "Concluída" } as any)
      .eq(tipo === "conta" ? "conta_id" : "oportunidade_id", id).eq("origem", "standby").neq("status", "Concluída");
    toast.success("Standby encerrado");
    onChange?.();
  };

  return (
    <>
      {standbyAte ? (
        <Button size="sm" variant="outline" onClick={retomar}><PlayCircle className="h-4 w-4 mr-1" />Retomar agora</Button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}><PauseCircle className="h-4 w-4 mr-1" />Colocar em standby</Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Colocar em standby</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Retomar contato em</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRAZOS.map((p) => (
                  <Button key={p} type="button" size="sm" variant={dias === p ? "default" : "outline"} onClick={() => { setDias(p); setData(""); }}>{p} dias</Button>
                ))}
              </div>
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">Ou escolha uma data</Label>
                <Input type="date" value={data} onChange={(e) => { setData(e.target.value); setDias(null); }} />
              </div>
            </div>
            <div>
              <Label>Motivo / observação</Label>
              <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: Cliente pediu para ligar em 15 dias" />
            </div>
            <p className="text-xs text-muted-foreground">A etapa do funil não muda. Uma tarefa de retomada será criada para o corretor responsável.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={confirmar} disabled={saving}>{saving ? "Salvando..." : "Confirmar standby"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
