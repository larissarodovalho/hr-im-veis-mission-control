import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { toCuiabaInputValue, fromCuiabaInputValue } from "@/lib/datetime";

export type InteracaoEditavel = {
  id: string;
  tipo: string;
  resultado: string | null;
  descricao: string | null;
  created_at: string;
  pontualidade?: string | null;
};

const TIPOS = [
  { value: "mensagem", label: "Mensagem" },
  { value: "audio", label: "Áudio" },
  { value: "ligacao", label: "Ligação" },
  { value: "reuniao", label: "Reunião" },
  { value: "visita", label: "Visita" },
  { value: "email", label: "Email" },
  { value: "nota", label: "Nota" },
];

const RESULTADOS: Record<string, string> = {
  atendeu: "Atendeu",
  nao_atendeu: "Não atendeu",
  retornar: "Retornar",
  interessado: "Interessado",
  sem_interesse: "Sem interesse",
  agendou: "Agendou",
  encaminhado: "Encaminhado",
  sem_resposta: "Sem resposta",
  desclassificado: "Desclassificado",
};

type Props = {
  interacao: InteracaoEditavel;
  onChanged: () => void;
  /** Recalcula a pontualidade após editar data/hora. Retorne undefined para manter o valor atual. */
  pontualidadeFor?: (
    novoIso: string,
    descricao: string | null,
    tipo: string,
    original: InteracaoEditavel,
  ) => string | null | undefined;
};

/** Botões de editar/excluir interação — somente administradores (RLS já restringe no banco). */
export default function InteracaoAdminActions({ interacao, onChanged, pontualidadeFor }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [tipo, setTipo] = useState(interacao.tipo);
  const [resultado, setResultado] = useState(interacao.resultado ?? "");
  const [descricao, setDescricao] = useState(interacao.descricao ?? "");
  const [quando, setQuando] = useState(toCuiabaInputValue(interacao.created_at));
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setTipo(interacao.tipo);
    setResultado(interacao.resultado ?? "");
    setDescricao(interacao.descricao ?? "");
    setQuando(toCuiabaInputValue(interacao.created_at));
    setEditOpen(true);
  };

  const salvar = async () => {
    const novoIso = fromCuiabaInputValue(quando);
    if (!novoIso) return toast.error("Data/hora inválida");
    setSaving(true);
    const patch: {
      tipo: string;
      resultado: string | null;
      descricao: string | null;
      created_at: string;
      pontualidade?: string | null;
    } = {
      tipo,
      resultado: resultado || null,
      descricao: descricao.trim() || null,
      created_at: novoIso,
    };
    if (pontualidadeFor) {
      const p = pontualidadeFor(novoIso, patch.descricao, tipo, interacao);
      if (p !== undefined) patch.pontualidade = p;
    }
    const { error } = await supabase.from("interacoes").update(patch).eq("id", interacao.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Interação atualizada");
    setEditOpen(false);
    onChanged();
  };

  const excluir = async () => {
    const { error } = await supabase.from("interacoes").delete().eq("id", interacao.id);
    if (error) return toast.error(error.message);
    toast.success("Interação excluída");
    setDelOpen(false);
    onChanged();
  };

  return (
    <>
      <div className="flex items-center gap-0.5">
        <Button size="icon" variant="ghost" className="h-7 w-7" title="Editar interação" onClick={openEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon" variant="ghost"
          className="h-7 w-7 text-danger hover:text-danger"
          title="Excluir interação"
          onClick={() => setDelOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar interação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Resultado</Label>
                <Select value={resultado || "none"} onValueChange={v => setResultado(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {Object.entries(RESULTADOS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Data e hora (Cuiabá)</Label>
              <Input type="datetime-local" value={quando} onChange={e => setQuando(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">
                Fuso de Cuiabá (UTC-4). Se for uma tentativa de contato, o selo de pontualidade é recalculado.
              </p>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={4} value={descricao} onChange={e => setDescricao(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir interação?</AlertDialogTitle>
            <AlertDialogDescription>
              {interacao.descricao
                ? `"${interacao.descricao.slice(0, 140)}${interacao.descricao.length > 140 ? "…" : ""}"`
                : "Esta interação"}{" "}
              será removida do histórico definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
