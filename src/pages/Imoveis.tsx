import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Home as HomeIcon, Plus } from "lucide-react";
import NovoImovelDialog from "@/components/imoveis/NovoImovelDialog";

export default function Imoveis() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);

  const load = () => {
    supabase.from("imoveis").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number | null) => n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const filtered = items.filter(i => !search || i.titulo?.toLowerCase().includes(search.toLowerCase()) || i.cidade?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 space-y-6">
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
            {i.fotos?.[0] ? (
              <img src={i.fotos[0]} alt={i.titulo} className="w-full h-44 object-cover" />
            ) : (
              <div className="w-full h-44 bg-muted flex items-center justify-center text-muted-foreground">
                <HomeIcon className="h-10 w-10 opacity-30" />
              </div>
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm leading-tight">{i.titulo}</h3>
                <Badge variant="outline" className="text-[10px] shrink-0">{i.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{i.cidade}{i.estado && ` · ${i.estado}`}</div>
              <div className="flex items-center justify-between pt-1">
                <Badge variant="secondary" className="text-[10px]">{i.finalidade} · {i.tipo}</Badge>
                <span className="font-semibold text-primary">{fmt(i.valor)}</span>
              </div>
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
    </div>
  );
}
