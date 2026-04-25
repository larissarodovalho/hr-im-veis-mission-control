import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarCheck, Plus } from "lucide-react";
import { EventsCalendar } from "@/components/EventsCalendar";

export default function Meetings() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ lead_id: "none", agendada_para: "", local: "", link: "", notas: "" });

  const load = async () => {
    const { data } = await supabase.from("reunioes").select("*, leads(id,nome)").order("agendada_para");
    setItems(data ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("leads").select("id, nome").order("nome").then(({ data }) => setLeads(data ?? []));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agendada_para) return toast.error("Informe data");
    const { error } = await supabase.from("reunioes").insert({
      lead_id: form.lead_id === "none" ? null : form.lead_id,
      agendada_para: new Date(form.agendada_para).toISOString(),
      local: form.local || null, link: form.link || null, notas: form.notas || null,
      created_by: user?.id, corretor_id: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Reunião adicionada");
    setForm({ lead_id: "none", agendada_para: "", local: "", link: "", notas: "" });
    setOpen(false);
    load();
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold flex items-center gap-2"><CalendarCheck className="h-7 w-7" /> Reuniões</h1>
          <p className="text-sm text-muted-foreground mt-1">Agendamentos da equipe.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova reunião</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div>
                <Label>Lead</Label>
                <Select value={form.lead_id} onValueChange={v => setForm({ ...form, lead_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sem lead vinculado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem lead vinculado</SelectItem>
                    {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Data e hora</Label><Input type="datetime-local" value={form.agendada_para} onChange={e => setForm({ ...form, agendada_para: e.target.value })} /></div>
              <div><Label>Local</Label><Input value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} /></div>
              <div><Label>Link</Label><Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} /></div>
              <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Data</th><th className="p-3">Lead</th><th className="p-3">Local</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {items.map(m => (
              <tr key={m.id} className="border-t">
                <td className="p-3 whitespace-nowrap">{format(new Date(m.agendada_para), "Pp", { locale: ptBR })}</td>
                <td className="p-3">{m.leads?.id ? <Link to={`/app/leads/${m.lead_id}`} className="hover:underline font-medium">{m.leads.nome}</Link> : "—"}</td>
                <td className="p-3 text-muted-foreground">{m.local || m.link || "—"}</td>
                <td className="p-3"><Badge variant="outline">{m.status}</Badge></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Nada por aqui.</td></tr>}
          </tbody>
        </table>
      </Card>

      <EventsCalendar
        title="Calendário de reuniões"
        events={items.map(m => ({ id: m.id, date: new Date(m.agendada_para), title: m.leads?.nome || "Sem lead", lead_id: m.lead_id, status: m.status, description: m.local || m.notas }))}
      />
    </div>
  );
}
