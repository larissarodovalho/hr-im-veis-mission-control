import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Pencil, Building2, Phone, Mail, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function AccountDetail() {
  const { id } = useParams();
  const [acc, setAcc] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from("contas").select("*").eq("id", id).maybeSingle();
    setAcc(data);
  };
  useEffect(() => { load(); }, [id]);

  if (!acc) return <div className="p-8 text-muted-foreground">Carregando…</div>;

  const save = async () => {
    if (!editing.nome.trim()) return toast.error("Nome obrigatório");
    const { error } = await supabase.from("contas").update({
      nome: editing.nome.trim(),
      email: editing.email?.trim() || null,
      telefone: editing.telefone?.trim() || null,
      endereco: editing.endereco?.trim() || null,
      observacoes: editing.observacoes?.trim() || null,
    }).eq("id", acc.id);
    if (error) return toast.error(error.message);
    toast.success("Conta atualizada");
    setEditing(null);
    load();
  };

  return (
    <div className="p-8 space-y-6">
      <Link to="/app/contas" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2"><Building2 className="h-7 w-7 text-primary" /> {acc.nome}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-muted-foreground">
            {acc.telefone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {acc.telefone}</span>}
            {acc.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {acc.email}</span>}
            <Badge variant="secondary">{acc.tipo}</Badge>
            {acc.lead_id_origem && <Link to={`/app/leads/${acc.lead_id_origem}`} className="text-primary hover:underline">Ver lead original</Link>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Convertido em {format(new Date(acc.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
        <Button variant="outline" onClick={() => setEditing({ ...acc })}><Pencil className="h-4 w-4 mr-1" /> Editar</Button>
      </div>

      {acc.endereco && <Card className="p-5"><h3 className="font-display text-lg font-semibold mb-2">Endereço</h3><p className="text-sm text-muted-foreground">{acc.endereco}</p></Card>}
      {acc.observacoes && <Card className="p-5"><h3 className="font-display text-lg font-semibold mb-2">Observações</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap">{acc.observacoes}</p></Card>}

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar conta</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nome*</Label><Input value={editing.nome} onChange={e => setEditing({ ...editing, nome: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Telefone</Label><Input value={editing.telefone ?? ""} onChange={e => setEditing({ ...editing, telefone: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={editing.email ?? ""} onChange={e => setEditing({ ...editing, email: e.target.value })} /></div>
              </div>
              <div><Label>Endereço</Label><Input value={editing.endereco ?? ""} onChange={e => setEditing({ ...editing, endereco: e.target.value })} /></div>
              <div><Label>Observações</Label><Textarea rows={3} value={editing.observacoes ?? ""} onChange={e => setEditing({ ...editing, observacoes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}><Save className="h-4 w-4 mr-1" />Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
