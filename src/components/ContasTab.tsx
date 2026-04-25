import { useState } from "react";
import { useContas, ContaDB } from "@/hooks/useContas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Phone, Mail, Pencil, Trash2, Loader2, Building2 } from "lucide-react";

const empty: Partial<ContaDB> = {
  nome: "", tipo: "PF", documento: "", email: "", telefone: "", endereco: "", observacoes: "",
};

export default function ContasTab() {
  const { contas, loading, createConta, updateConta, deleteConta } = useContas();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContaDB | null>(null);
  const [form, setForm] = useState<Partial<ContaDB>>(empty);
  const [saving, setSaving] = useState(false);

  const filtered = contas.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.nome.toLowerCase().includes(q) || (c.documento ?? "").includes(q) || (c.email ?? "").toLowerCase().includes(q);
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(c: ContaDB) { setEditing(c); setForm(c); setOpen(true); }

  async function salvar() {
    if (!form.nome?.trim()) return;
    setSaving(true);
    if (editing) await updateConta(editing.id, form);
    else await createConta(form);
    setSaving(false);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, documento, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4" /> Nova Conta</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Editar conta" : "Nova conta"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5 col-span-2">
                  <Label>Nome *</Label>
                  <Input value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.tipo ?? "PF"} onValueChange={(v) => setForm({ ...form, tipo: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>{form.tipo === "PJ" ? "CNPJ" : "CPF"}</Label>
                  <Input value={form.documento ?? ""} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Telefone</Label>
                  <Input value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Endereço</Label>
                <Input value={form.endereco ?? ""} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Observações</Label>
                <Textarea rows={3} value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={salvar} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {contas.length === 0 ? "Nenhuma conta ainda. Crie a partir de um lead convertido ou clique em \"Nova Conta\"." : "Nenhuma conta encontrada."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((c) => (
            <Card key={c.id} className="border-border/50 hover:border-primary/40 transition">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{c.nome}</p>
                    <Badge variant="outline" className="text-[10px]">{c.tipo}</Badge>
                    {c.documento && <Badge variant="secondary" className="text-[10px]">{c.documento}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {c.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefone}</span>}
                    {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                        <AlertDialogDescription>"{c.nome}" será removida.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteConta(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
