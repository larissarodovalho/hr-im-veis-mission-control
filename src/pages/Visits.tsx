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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { EventsCalendar } from "@/components/EventsCalendar";

export default function Visits() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ lead_id: "", imovel_id: "none", data_visita: "", observacoes: "" });

  const load = async () => {
    const { data } = await supabase.from("visitas").select("*, leads(id,nome), imoveis(id,titulo)").order("data_visita", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("leads").select("id, nome").order("nome").then(({ data }) => setLeads(data ?? []));
    supabase.from("imoveis").select("id, titulo").order("titulo").then(({ data }) => setImoveis(data ?? []));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lead_id) return toast.error("Selecione um lead");
    if (!form.data_visita) return toast.error("Informe a data");
    const { error } = await supabase.from("visitas").insert({
      lead_id: form.lead_id,
      imovel_id: form.imovel_id === "none" ? null : form.imovel_id,
      data_visita: new Date(form.data_visita).toISOString(),
      observacoes: form.observacoes || null,
      created_by: user?.id, corretor_id: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Visita registrada");
    setForm({ lead_id: "", imovel_id: "none", data_visita: "", observacoes: "" });
    setOpen(false); load();
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="font-display text-2xl md:text-3xl font-semibold">Visitas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" />Adicionar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova visita</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div>
                <Label>Lead</Label>
                <Select value={form.lead_id} onValueChange={v => setForm({ ...form, lead_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{leads.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Imóvel (opcional)</Label>
                <Select value={form.imovel_id} onValueChange={v => setForm({ ...form, imovel_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem imóvel</SelectItem>
                    {imoveis.map(i => <SelectItem key={i.id} value={i.id}>{i.titulo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Data e hora</Label><Input type="datetime-local" value={form.data_visita} onChange={e => setForm({ ...form, data_visita: e.target.value })} /></div>
              <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
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
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Quando</th><th className="p-3">Lead</th><th className="p-3">Imóvel</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {items.map(v => (
              <tr key={v.id} className="border-t">
                <td className="p-3">{format(new Date(v.data_visita), "Pp", { locale: ptBR })}</td>
                <td className="p-3">{v.leads?.id ? <Link to={`/app/leads/${v.lead_id}`} className="hover:underline font-medium">{v.leads.nome}</Link> : "—"}</td>
                <td className="p-3 text-muted-foreground">{v.imoveis?.titulo || "—"}</td>
                <td className="p-3"><Badge variant="outline">{v.status}</Badge></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sem visitas.</td></tr>}
          </tbody>
        </table>
      </Card>

      <EventsCalendar
        title="Calendário de visitas"
        events={items.map(v => ({ id: v.id, date: new Date(v.data_visita), title: v.leads?.nome || "Sem lead", lead_id: v.lead_id, status: v.status, description: v.imoveis?.titulo || v.observacoes }))}
      />
    </div>
  );
}
