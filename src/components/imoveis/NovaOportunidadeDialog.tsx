import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function NovaOportunidadeDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<{ id: string; nome: string }[]>([]);
  const [contas, setContas] = useState<{ id: string; nome: string }[]>([]);
  const [imoveis, setImoveis] = useState<{ id: string; nome: string }[]>([]);
  const [corretores, setCorretores] = useState<{ id: string; nome: string }[]>([]);

  const [clienteTipo, setClienteTipo] = useState<"lead" | "conta">("lead");
  const [clienteId, setClienteId] = useState("none");
  const [titulo, setTitulo] = useState("");
  const [descricaoBusca, setDescricaoBusca] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [tipoImovel, setTipoImovel] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta">("media");
  const [corretorId, setCorretorId] = useState("none");
  const [observacoes, setObservacoes] = useState("");
  const [imoveisVinculados, setImoveisVinculados] = useState<string[]>([]);
  const [novoImovel, setNovoImovel] = useState("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.from("leads").select("id,nome").order("nome").then(({ data }) => setLeads((data ?? []) as any));
    supabase.from("contas").select("id,nome").order("nome").then(({ data }) => setContas((data ?? []) as any));
    supabase.from("imoveis").select("id,titulo,codigo").order("created_at", { ascending: false }).then(({ data }) => {
      setImoveis((data ?? []).map((i: any) => ({ id: i.id, nome: `${i.codigo ? i.codigo + " · " : ""}${i.titulo}` })));
    });
    supabase.from("profiles").select("user_id,nome").then(({ data }) => {
      setCorretores((data ?? []).map((p: any) => ({ id: p.user_id, nome: p.nome || "Sem nome" })));
    });
  }, [open]);

  const reset = () => {
    setClienteTipo("lead"); setClienteId("none"); setTitulo(""); setDescricaoBusca("");
    setValorAlvo(""); setTipoImovel(""); setCidade(""); setBairro("");
    setPrioridade("media"); setCorretorId("none"); setObservacoes("");
    setImoveisVinculados([]); setNovoImovel("none");
  };

  const addImovel = (id: string) => {
    if (id === "none" || imoveisVinculados.includes(id)) return;
    setImoveisVinculados([...imoveisVinculados, id]);
    setNovoImovel("none");
  };

  const submit = async () => {
    if (!titulo.trim()) { toast.error("Informe um título"); return; }
    if (clienteId === "none") { toast.error("Selecione o cliente"); return; }
    setSaving(true);
    const { data, error } = await supabase.from("oportunidades").insert({
      cliente_tipo: clienteTipo,
      cliente_id: clienteId,
      titulo: titulo.trim(),
      descricao_busca: descricaoBusca || null,
      valor_alvo: valorAlvo ? Number(valorAlvo) : null,
      tipo_imovel: tipoImovel || null,
      cidade: cidade || null,
      bairro: bairro || null,
      prioridade,
      corretor_id: corretorId === "none" ? null : corretorId,
      observacoes: observacoes || null,
      created_by: user?.id,
    }).select("id").single();
    if (error || !data) {
      setSaving(false);
      toast.error(error?.message || "Erro ao criar oportunidade");
      return;
    }
    if (imoveisVinculados.length) {
      await supabase.from("oportunidade_imoveis").insert(
        imoveisVinculados.map((imovel_id) => ({ oportunidade_id: data.id, imovel_id }))
      );
    }
    setSaving(false);
    toast.success("Oportunidade criada");
    reset();
    onOpenChange(false);
    onCreated();
  };

  const clienteOptions = clienteTipo === "lead" ? leads : contas;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Nova oportunidade</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Casa 3M no Jardim Europa" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de cliente</Label>
              <Select value={clienteTipo} onValueChange={(v: any) => { setClienteTipo(v); setClienteId("none"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="conta">Conta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cliente *</Label>
              <SearchableSelect value={clienteId} onChange={setClienteId} options={clienteOptions} placeholder="Buscar..." emptyLabel="Selecione" />
            </div>
          </div>

          <div>
            <Label>O que o cliente busca</Label>
            <Textarea value={descricaoBusca} onChange={(e) => setDescricaoBusca(e.target.value)} placeholder="Casa 4 quartos, com piscina, área nobre..." rows={3} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Valor alvo (R$)</Label>
              <Input type="number" value={valorAlvo} onChange={(e) => setValorAlvo(e.target.value)} placeholder="3000000" />
            </div>
            <div>
              <Label>Tipo de imóvel</Label>
              <Input value={tipoImovel} onChange={(e) => setTipoImovel(e.target.value)} placeholder="Casa" />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cidade</Label>
              <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Corretor responsável</Label>
            <SearchableSelect value={corretorId} onChange={setCorretorId} options={corretores} placeholder="Buscar corretor..." emptyLabel="Sem responsável" />
          </div>

          <div>
            <Label>Imóveis do portfólio (opcional)</Label>
            <SearchableSelect value={novoImovel} onChange={addImovel} options={imoveis.filter((i) => !imoveisVinculados.includes(i.id))} placeholder="Buscar imóvel..." emptyLabel="Adicionar imóvel" />
            {imoveisVinculados.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {imoveisVinculados.map((id) => {
                  const im = imoveis.find((i) => i.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {im?.nome || id}
                      <button onClick={() => setImoveisVinculados(imoveisVinculados.filter((x) => x !== id))}><X className="h-3 w-3" /></button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Criar oportunidade"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
