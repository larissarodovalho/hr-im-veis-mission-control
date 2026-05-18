import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Home as HomeIcon, Plus, Pencil } from "lucide-react";
import NovoImovelDialog from "@/components/imoveis/NovoImovelDialog";
import EditarImovelDialog from "@/components/imoveis/EditarImovelDialog";

export default function Imoveis() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [contas, setContas] = useState<Record<string, string>>({});

  const load = () => {
    supabase.from("imoveis").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
  };

  useEffect(() => {
    load();
    supabase.from("profiles").select("user_id,nome").then(({ data }) => {
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { if (p.user_id) map[p.user_id] = p.nome || "Sem nome"; });
      setProfiles(map);
    });
    supabase.from("contas").select("id,nome").then(({ data }) => {
      const map: Record<string, string> = {};
      (data ?? []).forEach((c: any) => { map[c.id] = c.nome; });
      setContas(map);
    });
  }, []);

  const fmt = (n: number | null) => n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const filtered = items.filter(i => !search || i.titulo?.toLowerCase().includes(search.toLowerCase()) || i.cidade?.toLowerCase().includes(search.toLowerCase()) || i.codigo?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2"><HomeIcon className="h-7 w-7 text-primary" /> Imóveis</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} imóveis</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar…" className="pl-8 w-64" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => setOpenNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Cadastrar imóvel
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(i => (
          <Card key={i.id} className="overflow-hidden">
            <div className="relative">
              {i.fotos?.[0] ? (
                <img src={i.fotos[0]} alt={i.titulo} className="w-full h-44 object-cover" />
              ) : (
                <div className="w-full h-44 bg-muted flex items-center justify-center text-muted-foreground">
                  <HomeIcon className="h-10 w-10 opacity-30" />
                </div>
              )}
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => setEditing(i)}
                title="Editar imóvel"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm leading-tight truncate">{i.titulo}</h3>
                  {i.codigo && (
                    <span className="text-[10px] font-mono text-muted-foreground">{i.codigo}</span>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{i.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{i.cidade}{i.estado && ` · ${i.estado}`}</div>
              <div className="text-[11px] text-muted-foreground space-y-0.5">
                <div>Corretor: <span className="text-foreground">{profiles[i.corretor_id] || "—"}</span></div>
                <div>Proprietário: <span className="text-foreground">{contas[i.proprietario_id] || "—"}</span></div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <Badge variant="secondary" className="text-[10px]">{i.finalidade} · {i.tipo}</Badge>
                <span className="font-semibold text-primary">{fmt(i.valor)}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setEditing(i)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground col-span-full">
            Nenhum imóvel cadastrado. Clique em <strong>Cadastrar imóvel</strong> para começar.
          </Card>
        )}
      </div>

      <NovoImovelDialog open={openNew} onOpenChange={setOpenNew} onCreated={load} />
      <EditarImovelDialog
        open={!!editing}
        onOpenChange={(v) => { if (!v) setEditing(null); }}
        imovel={editing}
        onSaved={load}
      />
    </div>
  );
}
