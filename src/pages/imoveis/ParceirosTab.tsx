import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import NovoCorretorParceiroDialog from "@/components/imoveis/NovoCorretorParceiroDialog";

export default function ParceirosTab() {
  const { isAdmin, isGestor } = useRole();
  const canEdit = isAdmin || isGestor;
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [vinculos, setVinculos] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const [pRes, cRes] = await Promise.all([
      supabase.from("corretores_parceiros").select("*").order("nome"),
      supabase.from("contas").select("parceiro_origem_id").not("parceiro_origem_id", "is", null),
    ]);
    setParceiros(pRes.data ?? []);
    const counts: Record<string, number> = {};
    (cRes.data ?? []).forEach((c: any) => { counts[c.parceiro_origem_id] = (counts[c.parceiro_origem_id] || 0) + 1; });
    setVinculos(counts);
  };
  useEffect(() => { load(); }, []);

  const onDelete = async (p: any) => {
    const ct = vinculos[p.id] || 0;
    if (!confirm(`Excluir parceiro "${p.nome}"?${ct ? ` ${ct} conta(s) ficarão sem vínculo.` : ""}`)) return;
    const { error } = await supabase.from("corretores_parceiros").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Parceiro excluído");
    load();
  };

  const filtered = parceiros.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (p.nome || "").toLowerCase().includes(s)
      || (p.telefone || "").toLowerCase().includes(s)
      || (p.email || "").toLowerCase().includes(s)
      || (p.creci || "").toLowerCase().includes(s)
      || (p.cidade || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8 w-64" placeholder="Buscar parceiro…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {canEdit && (
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo parceiro
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>CRECI</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead className="text-right">Comissão %</TableHead>
              <TableHead className="text-center">Clientes</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={canEdit ? 9 : 8} className="text-center text-muted-foreground py-12">
                <UserCheck className="mx-auto h-8 w-8 mb-2 opacity-40" />
                Nenhum corretor parceiro cadastrado.{canEdit && " Clique em \"Novo parceiro\" para começar."}
              </TableCell></TableRow>
            )}
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell className="text-sm">{p.telefone || "—"}</TableCell>
                <TableCell className="text-sm">{p.email || "—"}</TableCell>
                <TableCell className="text-sm font-mono">{p.creci || "—"}</TableCell>
                <TableCell className="text-sm">{p.cidade ? `${p.cidade}${p.estado ? `/${p.estado}` : ""}` : "—"}</TableCell>
                <TableCell className="text-right">{p.comissao_padrao != null ? `${p.comissao_padrao}%` : "—"}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{vinculos[p.id] || 0}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={p.ativo ? "outline" : "secondary"} className={p.ativo ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300" : ""}>
                    {p.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <NovoCorretorParceiroDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        initial={editing}
        onSaved={load}
      />
    </div>
  );
}
