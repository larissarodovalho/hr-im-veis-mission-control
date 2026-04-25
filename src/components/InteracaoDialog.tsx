import { useState } from "react";
import { useInteracoes } from "@/hooks/useInteracoes";
import { INTERACAO_TIPOS, INTERACAO_RESULTADOS } from "@/lib/leads";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

interface Props {
  leadId?: string;
  contaId?: string;
  trigger?: React.ReactNode;
  defaultTipo?: string;
}

export default function InteracaoDialog({ leadId, contaId, trigger, defaultTipo }: Props) {
  const { create } = useInteracoes({ leadId, contaId });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tipo, setTipo] = useState<string>(defaultTipo ?? "nota");
  const [resultado, setResultado] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [proximaAcao, setProximaAcao] = useState<string>("");
  const [agendadoPara, setAgendadoPara] = useState<string>("");

  function reset() {
    setTipo(defaultTipo ?? "nota");
    setResultado("");
    setDescricao("");
    setProximaAcao("");
    setAgendadoPara("");
  }

  async function salvar() {
    setSaving(true);
    const res = await create({
      tipo: tipo as any,
      resultado: resultado || null,
      descricao: descricao || null,
      proxima_acao: proximaAcao || null,
      agendado_para: agendadoPara ? new Date(agendadoPara).toISOString() : null,
    });
    setSaving(false);
    if (!res.error) {
      reset();
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Registrar interação</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nova interação</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTERACAO_TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Resultado</Label>
            <Select value={resultado} onValueChange={setResultado}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {INTERACAO_RESULTADOS.map((r) => (
                  <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Descrição</Label>
            <Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que aconteceu?" />
          </div>
          <div className="grid gap-1.5">
            <Label>Próxima ação</Label>
            <Input value={proximaAcao} onChange={(e) => setProximaAcao(e.target.value)} placeholder="Ex: ligar amanhã às 10h" />
          </div>
          <div className="grid gap-1.5">
            <Label>Agendado para</Label>
            <Input type="datetime-local" value={agendadoPara} onChange={(e) => setAgendadoPara(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
