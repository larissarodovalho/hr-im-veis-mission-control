import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function EditarOportunidadeDialog({ open, onOpenChange, oportunidade, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; oportunidade: any; onSaved: () => void }) {
  const [imoveis, setImoveis] = useState<{ id: string; nome: string }[]>([]);
  const [corretores, setCorretores] = useState<{ id: string; nome: string }[]>([]);
  const [leads, setLeads] = useState<{ id: string; nome: string }[]>([]);
  const [contas, setContas] = useState<{ id: string; nome: string }[]>([]);
  const [clienteTipo, setClienteTipo] = useState<"lead" | "conta">("lead");
  const [clienteId, setClienteId] = useState("none");
  const [vinculos, setVinculos] = useState<any[]>([]);
  const [novoImovel, setNovoImovel] = useState("none");

  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !oportunidade) return;
    setForm({ ...oportunidade });
    setClienteTipo((oportunidade.cliente_tipo as "lead" | "conta") || "lead");
    setClienteId(oportunidade.cliente_id || "none");
    supabase.from("imoveis").select("id,titulo,codigo").order("created_at", { ascending: false }).then(({ data }) => {
      setImoveis((data ?? []).map((i: any) => ({ id: i.id, nome: `${i.codigo ? i.codigo + " · " : ""}${i.titulo}` })));
    });
    supabase.from("profiles").select("user_id,nome").then(({ data }) => {
      setCorretores((data ?? []).map((p: any) => ({ id: p.user_id, nome: p.nome || "Sem nome" })));
    });
    supabase.from("leads").select("id,nome").order("nome").then(({ data }) => {
      setLeads((data ?? []).map((l: any) => ({ id: l.id, nome: l.nome || "Sem nome" })));
    });
    supabase.from("contas").select("id,nome").order("nome").then(({ data }) => {
      setContas((data ?? []).map((c: any) => ({ id: c.id, nome: c.nome || "Sem nome" })));
    });
    supabase.from("oportunidade_imoveis").select("*").eq("oportunidade_id", oportunidade.id).then(({ data }) => {
      setVinculos(data ?? []);
    });
  }, [open, oportunidade]);

  const addImovel = async (imovel_id: string) => {
    if (imovel_id === "none" || vinculos.find((v) => v.imovel_id === imovel_id)) return;
    const { data } = await supabase.from("oportunidade_imoveis").insert({ oportunidade_id: oportunidade.id, imovel_id }).select().single();
    if (data) setVinculos([...vinculos, data]);
    setNovoImovel("none");
  };

  const removeVinculo = async (id: string) => {
    await supabase.from("oportunidade_imoveis").delete().eq("id", id);
    setVinculos(vinculos.filter((v) => v.id !== id));
  };

  const updateVinculo = async (id: string, patch: any) => {
    setVinculos(vinculos.map((v) => v.id === id ? { ...v, ...patch } : v));
    await supabase.from("oportunidade_imoveis").update(patch).eq("id", id);
  };

  const submit = async () => {
    if (clienteId === "none") { toast.error("Selecione o cliente"); return; }
    setSaving(true);
    const { error } = await supabase.from("oportunidades").update({
      titulo: form.titulo,
      descricao_busca: form.descricao_busca,
      valor_alvo: form.valor_alvo ? Number(form.valor_alvo) : null,
      tipo_imovel: form.tipo_imovel,
      cidade: form.cidade,
      bairro: form.bairro,
      prioridade: form.prioridade,
      estagio: form.estagio,
      corretor_id: form.corretor_id || null,
      observacoes: form.observacoes,
      cliente_tipo: clienteTipo,
      cliente_id: clienteId,
    }).eq("id", oportunidade.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Oportunidade atualizada");
    onOpenChange(false);
    onSaved();
  };

  const excluir = async () => {
    if (!confirm("Excluir esta oportunidade?")) return;
    await supabase.from("oportunidade_imoveis").delete().eq("oportunidade_id", oportunidade.id);
    const { error } = await supabase.from("oportunidades").delete().eq("id", oportunidade.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Oportunidade excluída");
    onOpenChange(false);
    onSaved();
  };

  if (!oportunidade) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Editar oportunidade</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={form.titulo || ""} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>

          <div className="grid grid-cols-3 gap-3">
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
            <div className="col-span-2">
              <Label>Cliente</Label>
              <SearchableSelect
                value={clienteId}
                onChange={setClienteId}
                options={clienteTipo === "lead" ? leads : contas}
                placeholder="Buscar..."
                emptyLabel="Selecione"
              />
            </div>
          </div>



          <div>
            <Label>O que o cliente busca</Label>
            <Textarea value={form.descricao_busca || ""} onChange={(e) => setForm({ ...form, descricao_busca: e.target.value })} rows={3} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Valor alvo (R$)</Label>
              <Input type="number" value={form.valor_alvo || ""} onChange={(e) => setForm({ ...form, valor_alvo: e.target.value })} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Input value={form.tipo_imovel || ""} onChange={(e) => setForm({ ...form, tipo_imovel: e.target.value })} />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade || "media"} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Cidade</Label>
              <Input value={form.cidade || ""} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={form.bairro || ""} onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
            </div>
            <div>
              <Label>Estágio</Label>
              <Select value={form.estagio || "nova"} onValueChange={(v) => setForm({ ...form, estagio: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nova">Nova</SelectItem>
                  <SelectItem value="buscando">Buscando imóvel</SelectItem>
                  <SelectItem value="visita">Visita agendada</SelectItem>
                  <SelectItem value="proposta">Em proposta</SelectItem>
                  <SelectItem value="ganha">Ganha</SelectItem>
                  <SelectItem value="perdida">Perdida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Corretor responsável</Label>
            <SearchableSelect value={form.corretor_id || "none"} onChange={(v) => setForm({ ...form, corretor_id: v === "none" ? null : v })} options={corretores} placeholder="Buscar..." emptyLabel="Sem responsável" />
          </div>

          <div className="border rounded-md p-3 space-y-2">
            <Label>Imóveis vinculados</Label>
            <SearchableSelect value={novoImovel} onChange={addImovel} options={imoveis.filter((i) => !vinculos.find((v) => v.imovel_id === i.id))} placeholder="Buscar imóvel..." emptyLabel="Adicionar imóvel" />
            {vinculos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum imóvel vinculado.</p>
            ) : (
              <div className="space-y-2">
                {vinculos.map((v) => {
                  const im = imoveis.find((i) => i.id === v.imovel_id);
                  return (
                    <div key={v.id} className="border rounded p-2 space-y-1.5 text-xs bg-muted/30">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-[10px]">{im?.nome || v.imovel_id}</Badge>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeVinculo(v.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={v.interesse || "medio"} onValueChange={(val) => updateVinculo(v.id, { interesse: val })}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Interesse" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixo">Interesse baixo</SelectItem>
                            <SelectItem value="medio">Interesse médio</SelectItem>
                            <SelectItem value="alto">Interesse alto</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input className="h-7 text-xs col-span-2" placeholder="Observação" value={v.observacao || ""} onChange={(e) => setVinculos(vinculos.map((x) => x.id === v.id ? { ...x, observacao: e.target.value } : x))} onBlur={(e) => updateVinculo(v.id, { observacao: e.target.value })} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={form.observacoes || ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="destructive" onClick={excluir} className="mr-auto">Excluir</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
