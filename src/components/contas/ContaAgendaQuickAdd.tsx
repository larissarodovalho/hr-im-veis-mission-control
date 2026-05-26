import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarPlus, Phone, MapPin, Save, Camera } from "lucide-react";
import { toast } from "sonner";

type Kind = "reuniao" | "ligacao" | "visita" | "captacao";

interface Props {
  contaId: string;
  responsavelId?: string | null;
  onCreated?: () => void;
}

const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function ContaAgendaQuickAdd({ contaId, responsavelId, onCreated }: Props) {
  const [open, setOpen] = useState<Kind | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const openDialog = (kind: Kind) => {
    setForm({
      when: nowLocal(),
      duracao: kind === "ligacao" ? 30 : 60,
      tipo: "presencial",
      local: "",
      link: "",
      notas: "",
    });
    setOpen(kind);
  };

  const close = () => { setOpen(null); setForm({}); };

  const save = async () => {
    if (!open) return;
    if (!form.when) return toast.error("Informe data e hora");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id ?? null;
    const corretor = responsavelId || uid;
    const whenISO = new Date(form.when).toISOString();
    let error: any;
    let createdId: string | null = null;
    let entityType: "reuniao" | "ligacao" | "visita" | "captacao" | null = null;

    if (open === "reuniao") {
      const res = await supabase.from("reunioes").insert({
        conta_id: contaId,
        agendada_para: whenISO,
        duracao_min: Number(form.duracao) || 60,
        tipo: form.tipo || "presencial",
        local: form.local?.trim() || null,
        link: form.link?.trim() || null,
        notas: form.notas?.trim() || null,
        status: "agendada",
        created_by: uid,
        corretor_id: corretor,
      }).select("id").maybeSingle();
      error = res.error; createdId = res.data?.id ?? null; entityType = "reuniao";
    } else if (open === "ligacao") {
      const res = await supabase.from("ligacoes").insert({
        conta_id: contaId,
        data: whenISO,
        duracao_seg: (Number(form.duracao) || 30) * 60,
        notas: form.notas?.trim() || null,
        resultado: "agendada",
        created_by: uid,
        corretor_id: corretor,
      }).select("id").maybeSingle();
      error = res.error; createdId = res.data?.id ?? null; entityType = "ligacao";
    } else if (open === "visita") {
      const res = await supabase.from("visitas").insert({
        conta_id: contaId,
        data_visita: whenISO,
        observacoes: form.notas?.trim() || null,
        status: "Agendada",
        created_by: uid,
        corretor_id: corretor,
      } as any).select("id").maybeSingle();
      error = res.error; createdId = res.data?.id ?? null; entityType = "visita";
    } else if (open === "captacao") {
      // Procurar captação aberta para a conta
      const { data: existente } = await supabase
        .from("captacoes_imovel")
        .select("id, responsavel_id")
        .eq("conta_id", contaId)
        .neq("estagio", "concluido")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existente?.id) {
        const upd: any = {
          data_agendada: whenISO,
          estagio: "agendada",
          observacoes: form.notas?.trim() || null,
        };
        if (!existente.responsavel_id && corretor) upd.responsavel_id = corretor;
        const res = await supabase
          .from("captacoes_imovel")
          .update(upd)
          .eq("id", existente.id)
          .select("id")
          .maybeSingle();
        error = res.error; createdId = res.data?.id ?? existente.id;
      } else {
        const res = await supabase.from("captacoes_imovel").insert({
          conta_id: contaId,
          data_agendada: whenISO,
          estagio: "agendada",
          observacoes: form.notas?.trim() || null,
          responsavel_id: corretor,
          created_by: uid,
        } as any).select("id").maybeSingle();
        error = res.error; createdId = res.data?.id ?? null;
      }
      entityType = "captacao";

      // Move a conta para o funil de captação (se ainda não estiver)
      if (!error) {
        await supabase
          .from("contas")
          .update({ etapa_funil: "captacao_imovel" })
          .eq("id", contaId)
          .neq("etapa_funil", "captacao_imovel");
      }
    }

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Agendado com sucesso");

    // Sincroniza com Google Calendar (silencioso se falhar)
    if (createdId && entityType) {
      supabase.functions.invoke("gcal-push", {
        body: { entity_type: entityType, entity_id: createdId, action: "create" },
      }).catch(() => {});
    }

    close();
    onCreated?.();
  };

  const title =
    open === "reuniao" ? "Nova reunião" :
    open === "ligacao" ? "Nova ligação" :
    open === "captacao" ? "Agendar captação" :
    "Nova visita";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-display text-lg font-semibold">Agendar</h3>
          <p className="text-sm text-muted-foreground">Cria o compromisso e já reserva o horário na agenda geral.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => openDialog("reuniao")}>
            <CalendarPlus className="h-4 w-4 mr-1" /> Reunião
          </Button>
          <Button variant="outline" onClick={() => openDialog("ligacao")}>
            <Phone className="h-4 w-4 mr-1" /> Ligação
          </Button>
          <Button variant="outline" onClick={() => openDialog("visita")}>
            <MapPin className="h-4 w-4 mr-1" /> Visita
          </Button>
          <Button variant="outline" onClick={() => openDialog("captacao")}>
            <Camera className="h-4 w-4 mr-1" /> Captação
          </Button>
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={o => !o && close()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data e hora</Label>
                <Input type="datetime-local" value={form.when ?? ""} onChange={e => setForm({ ...form, when: e.target.value })} />
              </div>
              {open !== "captacao" && (
                <div>
                  <Label>Duração (min)</Label>
                  <Input type="number" min={5} step={5} value={form.duracao ?? ""} onChange={e => setForm({ ...form, duracao: e.target.value })} />
                </div>
              )}
            </div>

            {open === "reuniao" && (
              <>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo || "presencial"} onValueChange={v => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="videochamada">Videochamada</SelectItem>
                      <SelectItem value="ligacao">Ligação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Local</Label><Input value={form.local ?? ""} onChange={e => setForm({ ...form, local: e.target.value })} /></div>
                  <div><Label>Link</Label><Input value={form.link ?? ""} onChange={e => setForm({ ...form, link: e.target.value })} /></div>
                </div>
              </>
            )}

            <div>
              <Label>{open === "visita" || open === "captacao" ? "Observações" : "Notas"}</Label>
              <Textarea rows={3} value={form.notas ?? ""} onChange={e => setForm({ ...form, notas: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" />Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
