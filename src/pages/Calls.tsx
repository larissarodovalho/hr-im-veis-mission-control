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
import { Phone, Plus } from "lucide-react";

export default function Calls() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ lead_id: "none", data: "", duracao_seg: 0, resultado: "atendeu", notas: "" });

  const load = async () => {
    const { data } = await supabase.from("ligacoes").select("*, leads(id,nome)").order("data", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("leads").select("id, nome").order("nome").then(({ data }) => setLeads(data ?? []));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.data) return toast.error("Informe data");
    const { error } = await supabase.from("ligacoes").insert({
      lead_id: form.lead_id === "none" ? null : form.lead_id,
      data: new Date(form.data).toISOString(),
      duracao_seg: Number(form.duracao_seg) || 0,
      resultado: form.resultado, notas: form.notas || null,
      created_by: user?.id, corretor_id: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Ligação registrada");
    setForm({ lead_id: "none", data: "", duracao_seg: 0, resultado: "atendeu", notas: "" });
    setOpen(false); load();
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold flex items-center gap-2"><Phone className="h-7 w-7" /> Ligações</h1>
          <p className="text-sm text-muted-foreground mt-1">Histórico de chamadas.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Registrar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova ligação</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div>
                <Label>Lead</Label>
                <Select value={form.lead_id} onValueChange={v => setForm({ ...form, lead_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sem lead" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem lead</SelectItem>
                    {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data e hora</Label><Input type="datetime-local" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></div>
                <div><Label>Duração (s)</Label><Input type="number" value={form.duracao_seg} onChange={e => setForm({ ...form, duracao_seg: Number(e.target.value) })} /></div>
              </div>
              <div>
                <Label>Resultado</Label>
                <Select value={form.resultado} onValueChange={v => setForm({ ...form, resultado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atendeu">Atendeu</SelectItem>
                    <SelectItem value="nao_atendeu">Não atendeu</SelectItem>
                    <SelectItem value="caixa_postal">Caixa postal</SelectItem>
                    <SelectItem value="agendou">Agendou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Quando</th><th className="p-3">Lead</th><th className="p-3">Duração</th><th className="p-3">Resultado</th></tr></thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{format(new Date(c.data), "Pp", { locale: ptBR })}</td>
                <td className="p-3">{c.leads?.id ? <Link to={`/app/leads/${c.lead_id}`} className="hover:underline font-medium">{c.leads.nome}</Link> : "—"}</td>
                <td className="p-3 text-muted-foreground">{c.duracao_seg ? `${Math.floor(c.duracao_seg/60)}m ${c.duracao_seg%60}s` : "—"}</td>
                <td className="p-3"><Badge variant="outline">{c.resultado || "—"}</Badge></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Nenhuma ligação.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
