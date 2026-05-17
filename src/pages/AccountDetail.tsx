import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Pencil, Building2, Phone, Save, FileSignature, Plus, Trash2, MapPin, Target } from "lucide-react";
import EntityDocumentsTab from "@/components/EntityDocumentsTab";
import ContaInteracoesTimeline from "@/components/contas/ContaInteracoesTimeline";
import ContaAgendaQuickAdd from "@/components/contas/ContaAgendaQuickAdd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type Propriedade = {
  id: string;
  conta_id: string;
  operacao: string | null;
  aptidao: string | null;
  nome_fazenda: string | null;
  regiao: string | null;
  tamanho_ha: number | null;
  valor_negocio: number | null;
  valor_comissao: number | null;
  observacoes: string | null;
};

const OPERACOES = ["Compra", "Venda", "Permuta", "Co-corretagem", "Outro"];
const APTIDOES = ["Agricultura", "Pecuária", "Mista", "Reflorestamento", "Outro"];

const fmtMoney = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function AccountDetail() {
  const { id } = useParams();
  const [acc, setAcc] = useState<any>(null);
  const [props, setProps] = useState<Propriedade[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [propEditing, setPropEditing] = useState<Partial<Propriedade> | null>(null);
  const [corretores, setCorretores] = useState<{ user_id: string; nome: string | null }[]>([]);

  const load = async () => {
    if (!id) return;
    const [{ data: a }, { data: p }, { data: c }] = await Promise.all([
      supabase.from("contas").select("*").eq("id", id).maybeSingle(),
      supabase.from("conta_propriedades").select("*").eq("conta_id", id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, nome").eq("ativo", true).order("nome"),
    ]);
    setAcc(a);
    setProps((p as Propriedade[]) || []);
    setCorretores((c as any) || []);
  };
  useEffect(() => { load(); }, [id]);

  const responsavelNome = acc?.responsavel_id
    ? corretores.find(c => c.user_id === acc.responsavel_id)?.nome ?? null
    : null;

  if (!acc) return <div className="p-4 sm:p-6 lg:p-8 text-muted-foreground">Carregando…</div>;

  const totalValor = props.reduce((s, p) => s + (Number(p.valor_negocio) || 0), 0);
  const totalComissao = props.reduce((s, p) => s + (Number(p.valor_comissao) || 0), 0);

  const listaAtual: "carteira" | "marketing" | "nenhuma" = (() => {
    const tags = ((acc?.tags ?? []) as string[]).map((t) => t.toLowerCase());
    if (tags.includes("carteira")) return "carteira";
    if (tags.includes("marketing")) return "marketing";
    return "nenhuma";
  })();

  const setLista = async (nova: "carteira" | "marketing" | "nenhuma") => {
    const base = ((acc.tags ?? []) as string[]).filter(
      (t) => t.toLowerCase() !== "carteira" && t.toLowerCase() !== "marketing"
    );
    const tags = nova === "nenhuma" ? base : [...base, nova];
    const { error } = await supabase.from("contas").update({ tags }).eq("id", acc.id);
    if (error) return toast.error(error.message);
    toast.success(nova === "nenhuma" ? "Removida das listas" : `Movida para ${nova === "carteira" ? "Carteira" : "Marketing"}`);
    load();
  };

  const save = async () => {
    if (!editing.nome.trim()) return toast.error("Nome obrigatório");
    const baseTags = ((acc.tags ?? []) as string[]).filter(
      (t) => t.toLowerCase() !== "carteira" && t.toLowerCase() !== "marketing"
    );
    const novaLista = editing.lista as "carteira" | "marketing" | "nenhuma" | undefined;
    const tags = !novaLista || novaLista === "nenhuma" ? baseTags : [...baseTags, novaLista];
    const { error } = await supabase.from("contas").update({
      nome: editing.nome.trim(),
      email: editing.email?.trim() || null,
      telefone: editing.telefone?.trim() || null,
      endereco: editing.endereco?.trim() || null,
      observacoes: editing.observacoes?.trim() || null,
      status: editing.status || "ativo",
      interesse: editing.interesse || null,
      responsavel_id: editing.responsavel_id || null,
      tags,
    }).eq("id", acc.id);
    if (error) return toast.error(error.message);
    toast.success("Conta atualizada");
    setEditing(null);
    load();
  };

  const saveProp = async () => {
    if (!propEditing) return;
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = {
      conta_id: acc.id,
      operacao: propEditing.operacao || null,
      aptidao: propEditing.aptidao || null,
      nome_fazenda: propEditing.nome_fazenda?.trim() || null,
      regiao: propEditing.regiao?.trim() || null,
      tamanho_ha: propEditing.tamanho_ha ? Number(propEditing.tamanho_ha) : null,
      valor_negocio: propEditing.valor_negocio ? Number(propEditing.valor_negocio) : null,
      valor_comissao: propEditing.valor_comissao ? Number(propEditing.valor_comissao) : null,
      observacoes: propEditing.observacoes?.trim() || null,
    };
    let error;
    if (propEditing.id) {
      ({ error } = await supabase.from("conta_propriedades").update(payload).eq("id", propEditing.id));
    } else {
      payload.created_by = user?.id;
      ({ error } = await supabase.from("conta_propriedades").insert(payload));
    }
    if (error) return toast.error(error.message);
    toast.success("Propriedade salva");
    setPropEditing(null);
    load();
  };

  const deleteProp = async (pid: string) => {
    if (!confirm("Excluir esta propriedade?")) return;
    const { error } = await supabase.from("conta_propriedades").delete().eq("id", pid);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    load();
  };

  const statusBadge = acc.status === "ativo"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-muted text-muted-foreground";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Link to="/crm/contas" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" /> {acc.nome}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-muted-foreground">
            {acc.telefone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {acc.telefone}</span>}
            <Badge variant="outline" className={statusBadge}>{acc.status === "ativo" ? "Ativo" : (acc.status || "Inativo")}</Badge>
            {acc.interesse && (
              <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 border text-sm px-2.5 py-1">
                <Target className="h-3.5 w-3.5 mr-1" /> Interesse: {acc.interesse}
              </Badge>
            )}
            {listaAtual !== "nenhuma" && (
              <Badge variant="outline" className={listaAtual === "carteira" ? "bg-blue-500/15 text-blue-700 border-blue-500/30" : "bg-pink-500/15 text-pink-700 border-pink-500/30"}>
                {listaAtual === "carteira" ? "Carteira" : "Marketing"}
              </Badge>
            )}
            {acc.lead_id_origem && <Link to={`/crm/leads/${acc.lead_id_origem}`} className="text-primary hover:underline">Ver lead original</Link>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Convertido em {format(new Date(acc.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Responsável: <span className="text-foreground font-medium">{responsavelNome || "—"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={listaAtual} onValueChange={(v) => setLista(v as any)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nenhuma">Sem lista</SelectItem>
              <SelectItem value="carteira">Carteira</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setEditing({ ...acc, lista: listaAtual })}><Pencil className="h-4 w-4 mr-1" /> Editar dados</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Propriedades</p>
          <p className="text-3xl font-semibold mt-1">{props.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Valor total dos negócios</p>
          <p className="text-3xl font-semibold mt-1">{totalValor > 0 ? fmtMoney(totalValor) : "—"}</p>
          {totalComissao > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Comissões: {fmtMoney(totalComissao)}</p>
          )}
        </Card>
      </div>

      <ContaAgendaQuickAdd contaId={acc.id} responsavelId={acc.responsavel_id} onCreated={load} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-semibold">Propriedades / Negócios</h2>
          <Button onClick={() => setPropEditing({})}><Plus className="h-4 w-4 mr-1" /> Adicionar propriedade</Button>
        </div>

        {props.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">Nenhuma propriedade cadastrada.</Card>
        ) : (
          <div className="space-y-3">
            {props.map(p => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.operacao && <Badge variant="secondary">{p.operacao}</Badge>}
                    {p.aptidao && <Badge variant="outline">{p.aptidao}</Badge>}
                    <span className="font-semibold">{p.nome_fazenda || "Sem nome"}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setPropEditing(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteProp(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {p.regiao && <p className="text-sm text-muted-foreground inline-flex items-center gap-1 mt-1"><MapPin className="h-3.5 w-3.5" /> {p.regiao}</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Tamanho</p>
                    <p className="text-sm">{p.tamanho_ha ? `${p.tamanho_ha} ha` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-sm">{fmtMoney(p.valor_negocio)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Comissão</p>
                    <p className="text-sm">{fmtMoney(p.valor_comissao)}</p>
                  </div>
                </div>
                {p.observacoes && <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{p.observacoes}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="p-5">
        <ContaInteracoesTimeline contaId={acc.id} />
      </Card>

      {acc.endereco && (
        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold mb-2">Endereço</h3>
          <p className="text-sm text-muted-foreground">{acc.endereco}</p>
        </Card>
      )}
      {acc.observacoes && (
        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold mb-2">Observações</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{acc.observacoes}</p>
        </Card>
      )}

      <Card className="p-5">
        <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          <FileSignature className="h-5 w-5" /> Documentos
        </h3>
        <EntityDocumentsTab contaId={acc.id} defaultSigner={{ name: acc.nome, email: acc.email }} />
      </Card>

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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status || "ativo"} onValueChange={v => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Interesse</Label>
                  <Select value={editing.interesse || ""} onValueChange={v => setEditing({ ...editing, interesse: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Comprar">Comprar</SelectItem>
                      <SelectItem value="Vender">Vender</SelectItem>
                      <SelectItem value="Alugar">Alugar</SelectItem>
                      <SelectItem value="Incorporar">Incorporar</SelectItem>
                      <SelectItem value="Investimento">Investimento</SelectItem>
                      <SelectItem value="Ocasião de oportunidade">Ocasião de oportunidade</SelectItem>
                      <SelectItem value="Permuta">Permuta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Responsável</Label>
                <Select
                  value={editing.responsavel_id || "none"}
                  onValueChange={v => setEditing({ ...editing, responsavel_id: v === "none" ? null : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {corretores.map(c => (
                      <SelectItem key={c.user_id} value={c.user_id}>{c.nome || "Sem nome"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lista</Label>
                <Select value={editing.lista || "nenhuma"} onValueChange={v => setEditing({ ...editing, lista: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Sem lista</SelectItem>
                    <SelectItem value="carteira">Carteira</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
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

      <Dialog open={!!propEditing} onOpenChange={o => !o && setPropEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{propEditing?.id ? "Editar propriedade" : "Nova propriedade"}</DialogTitle></DialogHeader>
          {propEditing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Operação</Label>
                  <Select value={propEditing.operacao || ""} onValueChange={v => setPropEditing({ ...propEditing, operacao: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{OPERACOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Aptidão</Label>
                  <Select value={propEditing.aptidao || ""} onValueChange={v => setPropEditing({ ...propEditing, aptidao: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{APTIDOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Nome da fazenda</Label><Input value={propEditing.nome_fazenda ?? ""} onChange={e => setPropEditing({ ...propEditing, nome_fazenda: e.target.value })} /></div>
              <div><Label>Região / Cidade-UF</Label><Input value={propEditing.regiao ?? ""} onChange={e => setPropEditing({ ...propEditing, regiao: e.target.value })} placeholder="Ex: Sinop-MT" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Tamanho (ha)</Label><Input type="number" value={propEditing.tamanho_ha ?? ""} onChange={e => setPropEditing({ ...propEditing, tamanho_ha: e.target.value as any })} /></div>
                <div><Label>Valor (R$)</Label><Input type="number" value={propEditing.valor_negocio ?? ""} onChange={e => setPropEditing({ ...propEditing, valor_negocio: e.target.value as any })} /></div>
                <div><Label>Comissão (R$)</Label><Input type="number" value={propEditing.valor_comissao ?? ""} onChange={e => setPropEditing({ ...propEditing, valor_comissao: e.target.value as any })} /></div>
              </div>
              <div><Label>Observações</Label><Textarea rows={3} value={propEditing.observacoes ?? ""} onChange={e => setPropEditing({ ...propEditing, observacoes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPropEditing(null)}>Cancelar</Button>
            <Button onClick={saveProp}><Save className="h-4 w-4 mr-1" />Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
