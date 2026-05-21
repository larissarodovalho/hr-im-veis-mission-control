import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/SearchableSelect";
import NovaContaDialog from "@/components/contas/NovaContaDialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Phone } from "lucide-react";

interface Props {
  corretorId: string;
  onCorretorChange: (v: string) => void;
  proprietarioId: string;
  onProprietarioChange: (v: string) => void;
  captadorId?: string;
  onCaptadorChange?: (v: string) => void;
  parceiroId?: string;
  onParceiroChange?: (v: string) => void;
}

export default function ResponsavelProprietarioSection({
  corretorId, onCorretorChange, proprietarioId, onProprietarioChange,
  captadorId = "", onCaptadorChange,
  parceiroId = "", onParceiroChange,
}: Props) {
  const [corretores, setCorretores] = useState<{ user_id: string; nome: string }[]>([]);
  const [contas, setContas] = useState<{ id: string; nome: string; documento?: string | null; telefone?: string | null }[]>([]);
  const [parceiros, setParceiros] = useState<{ id: string; nome: string }[]>([]);
  const [openNovaConta, setOpenNovaConta] = useState(false);

  const loadContas = () =>
    supabase.from("contas").select("id,nome,documento,telefone").order("nome").then(({ data }) => setContas(data ?? []));

  useEffect(() => {
    supabase.from("profiles").select("user_id,nome").eq("ativo", true).order("nome")
      .then(({ data }) => setCorretores((data ?? []).map((p: any) => ({ user_id: p.user_id, nome: p.nome || "Sem nome" }))));
    loadContas();
    supabase.from("corretores_parceiros").select("id,nome").eq("ativo", true).order("nome")
      .then(({ data }) => setParceiros((data ?? []) as any));
  }, []);

  const contaOptions = contas.map((c) => ({ id: c.id, nome: c.documento ? `${c.nome} · ${c.documento}` : c.nome }));
  const parceiroOptions = parceiros.map((p) => ({ id: p.id, nome: p.nome }));

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Responsável e proprietário</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Corretor responsável</Label>
          <Select value={corretorId} onValueChange={onCorretorChange}>
            <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
            <SelectContent>
              {corretores.map((c) => (
                <SelectItem key={c.user_id} value={c.user_id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Proprietário (conta)</Label>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <SearchableSelect
                value={proprietarioId || "none"}
                onChange={(v) => onProprietarioChange(v === "none" ? "" : v)}
                options={contaOptions}
                placeholder="Buscar conta…"
                emptyLabel="Sem proprietário"
              />
            </div>
            <Button type="button" variant="outline" size="icon" onClick={() => setOpenNovaConta(true)} title="Nova conta">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {onCaptadorChange && (
          <div>
            <Label>Corretor captador</Label>
            <Select value={captadorId || "none"} onValueChange={(v) => onCaptadorChange(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {corretores.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {onParceiroChange && (
          <div>
            <Label>Corretor parceiro (externo)</Label>
            <SearchableSelect
              value={parceiroId || "none"}
              onChange={(v) => onParceiroChange(v === "none" ? "" : v)}
              options={parceiroOptions}
              placeholder="Buscar parceiro…"
              emptyLabel="Sem parceiro"
            />
          </div>
        )}
      </div>

      <NovaContaDialog
        open={openNovaConta}
        onOpenChange={setOpenNovaConta}
        onCreated={async (newId) => {
          await loadContas();
          if (newId) onProprietarioChange(newId);
        }}
      />
    </section>
  );
}
