import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target } from "lucide-react";
import { toast } from "sonner";

export default function MetasVgvDialog({ corretores, anoInicial }: { corretores: Array<{ user_id: string; nome: string }>; anoInicial: number }) {
  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(anoInicial);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("metas_vgv").select("corretor_id, meta_vgv").eq("ano", ano).then(({ data }) => {
      const v: Record<string, string> = {};
      (data ?? []).forEach((m: any) => { v[m.corretor_id] = String(Number(m.meta_vgv)); });
      setValores(v);
    });
  }, [open, ano]);

  const salvar = async () => {
    setSalvando(true);
    const { data: u } = await supabase.auth.getUser();
    const rows = corretores
      .filter((c) => valores[c.user_id] !== undefined && valores[c.user_id] !== "")
      .map((c) => ({ corretor_id: c.user_id, ano, meta_vgv: Number(valores[c.user_id].replace(/\./g, "").replace(",", ".")) || 0, created_by: u.user?.id }));
    const { error } = rows.length ? await supabase.from("metas_vgv").upsert(rows, { onConflict: "corretor_id,ano" }) : { error: null };
    setSalvando(false);
    if (error) return toast.error("Erro ao salvar metas: " + error.message);
    toast.success("Metas salvas"); setOpen(false);
  };

  const anos = [anoInicial - 1, anoInicial, anoInicial + 1];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Target className="h-4 w-4 mr-1" /> Metas de VGV</Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Metas anuais de VGV</DialogTitle></DialogHeader>
        <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>{anos.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
        </Select>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {corretores.map((c) => (
            <div key={c.user_id} className="flex items-center justify-between gap-3">
              <span className="text-sm">{c.nome}</span>
              <Input className="w-40 text-right" inputMode="numeric" placeholder="R$ 0"
                value={valores[c.user_id] ?? ""} onChange={(e) => setValores((s) => ({ ...s, [c.user_id]: e.target.value }))} />
            </div>
          ))}
        </div>
        <DialogFooter><Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
