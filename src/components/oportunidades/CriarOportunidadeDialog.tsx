import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, AlertTriangle, Building2 } from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { categoriaLabel, isAtiva } from "@/lib/oportunidadesFunil";
import { format } from "date-fns";

/**
 * Modal "Criar Oportunidade de Negócio".
 * Toda nova oportunidade exige uma Conta (nunca um Lead direto).
 * Pode ser aberta a partir de uma conta (ponte Contas → Oportunidades) ou solta na página de Oportunidades.
 */
export default function CriarOportunidadeDialog({
  open,
  onOpenChange,
  onCreated,
  conta,
  definirDestinoComprar = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (oportunidadeId?: string) => void;
  conta?: any | null;
  definirDestinoComprar?: boolean;
}) {
  const { user } = useAuth();
  const [contas, setContas] = useState<{ id: string; nome: string }[]>([]);
  const [contaSel, setContaSel] = useState<any | null>(null);
  const [imoveis, setImoveis] = useState<{ id: string; nome: string }[]>([]);
  const [corretores, setCorretores] = useState<{ id: string; nome: string }[]>([]);
  const [ativas, setAtivas] = useState<any[]>([]);
  const [encerradas, setEncerradas] = useState<any[]>([]);

  const [confirmarOutra, setConfirmarOutra] = useState(false);
  const [saving, setSaving] = useState(false);
  // Chave de idempotência: gerada por abertura do modal; reenvios/duplo clique retornam a mesma oportunidade
  const [chave, setChave] = useState(() => crypto.randomUUID());

  const [form, setForm] = useState<any>({});
  const [imoveisVinculados, setImoveisVinculados] = useState<string[]>([]);
  const [novoImovel, setNovoImovel] = useState("none");

  const reset = () => {
    setForm({});
    setImoveisVinculados([]);
    setNovoImovel("none");
    setContaSel(null);
    setAtivas([]);
    setEncerradas([]);
    setConfirmarOutra(false);
    setChave(crypto.randomUUID());
  };


  const [buscandoContas, setBuscandoContas] = useState(false);
  const buscarContas = async (q: string) => {
    setBuscandoContas(true);
    const { data } = await supabase.rpc("search_contas_min", { _q: q || null, _limit: 30 });
    setContas(((data ?? []) as any[]).map((r) => ({ id: r.id, nome: r.nome || "Sem nome" })));
    setBuscandoContas(false);
  };


  // Carrega listas base
  useEffect(() => {
    if (!open) return;
    if (!conta) {
      buscarContas("");
    }
    supabase.from("imoveis").select("id,titulo,codigo").order("created_at", { ascending: false }).then(({ data }) => {
      setImoveis((data ?? []).map((i: any) => ({ id: i.id, nome: `${i.codigo ? i.codigo + " · " : ""}${i.titulo}` })));
    });
    supabase.from("profiles").select("user_id,nome").then(({ data }) => {
      setCorretores((data ?? []).map((p: any) => ({ id: p.user_id, nome: p.nome || "Sem nome" })));
    });
  }, [open, conta]);

  // Conta pré-selecionada (ponte a partir da conta)
  useEffect(() => {
    if (open && conta) selecionarConta(conta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, conta]);

  const selecionarConta = async (c: any) => {
    setContaSel(c);
    setConfirmarOutra(false);
    setForm((f: any) => ({
      ...f,
      corretor_id: f.corretor_id ?? c.responsavel_id ?? "none",
      origem: c.origem ?? f.origem,
    }));
    const { data } = await supabase
      .from("oportunidades")
      .select("id,titulo,estagio,created_at,corretor_id")
      .or(`conta_id.eq.${c.id},and(cliente_tipo.eq.conta,cliente_id.eq.${c.id})`);
    const todas = (data ?? []) as any[];
    setAtivas(todas.filter(isAtiva));
    setEncerradas(todas.filter((o) => !isAtiva(o)));
  };


  const addImovel = (id: string) => {
    if (id === "none" || imoveisVinculados.includes(id)) return;
    setImoveisVinculados([...imoveisVinculados, id]);
    setNovoImovel("none");
  };

  const submit = async () => {
    if (!contaSel) { toast.error("Selecione a conta"); return; }
    if (!form.titulo?.trim()) { toast.error("Informe um título"); return; }
    if (ativas.length > 0 && !confirmarOutra) { toast.error("Confirme que deseja criar outra oportunidade para esta conta"); return; }
    setSaving(true);

    // RPC transacional e idempotente: cria a oportunidade, marca a qualificação
    // na conta (status + destino comercial) e registra as interações no histórico
    const { data, error } = await supabase.rpc("criar_oportunidade_qualificada" as any, {
      p_conta_id: contaSel.id,
      p_payload: {
        titulo: form.titulo.trim(),
        descricao_busca: form.descricao_busca?.trim() || null,
        tipo_imovel: form.tipo_imovel?.trim() || null,
        cidade: form.cidade?.trim() || null,
        bairro: form.bairro?.trim() || null,
        valor_alvo: form.valor_alvo ? String(Number(form.valor_alvo)) : null,
        prioridade: form.prioridade || "media",
        corretor_id: !form.corretor_id || form.corretor_id === "none" ? contaSel.responsavel_id ?? null : form.corretor_id,
        forma_pagamento: form.forma_pagamento?.trim() || null,
        prazo_pretendido: form.prazo_pretendido?.trim() || null,
        possui_permuta: !!form.possui_permuta,
        imovel_permuta: form.possui_permuta ? form.imovel_permuta?.trim() || null : null,
        valor_estimado_permuta: form.possui_permuta && form.valor_estimado_permuta ? String(Number(form.valor_estimado_permuta)) : null,
        caracteristicas_indispensaveis: form.caracteristicas_indispensaveis?.trim() || null,
        observacoes: form.observacoes?.trim() || null,
      },
      p_chave: chave,
    } as any);

    const resultado = (data as any) ?? {};
    const opId = resultado.oportunidade_id as string | undefined;
    if (error || !opId) {
      setSaving(false);
      toast.error(error?.message || "Erro ao criar oportunidade");
      return;
    }

    if (imoveisVinculados.length && !resultado.ja_existia) {
      await supabase.from("oportunidade_imoveis").insert(
        imoveisVinculados.map((imovel_id) => ({ oportunidade_id: opId, imovel_id, created_by: user?.id })) as any
      );
    }

    setSaving(false);
    toast.success(resultado.ja_existia ? "Esta oportunidade já havia sido criada" : "Oportunidade criada na etapa Nova");
    reset();
    onOpenChange(false);
    onCreated(opId);
  };

  const f = (k: string) => form[k] ?? "";
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Criar Oportunidade de Negócio</DialogTitle>
          <DialogDescription>
            Oportunidade de compra de imóvel vinculada a uma Conta (Carteira ou Marketing). A conta não sai da categoria original.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conta */}
          {conta && contaSel ? (
            <div className="rounded-md border bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-primary" /> {contaSel.nome}
                {categoriaLabel(contaSel.categoria) && (
                  <Badge variant="outline" className="text-[10px]">Origem: {categoriaLabel(contaSel.categoria)}</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {[contaSel.telefone, contaSel.email].filter(Boolean).join(" · ") || "Sem telefone/e-mail"}
                {contaSel.origem ? ` · Origem: ${contaSel.origem}` : ""}
              </div>
              {contaSel.interesse && <div className="text-xs text-muted-foreground">Interesse: {contaSel.interesse}</div>}
            </div>
          ) : (
            <div>
              <Label>Conta *</Label>
              <SearchableSelect
                value={contaSel?.id ?? "none"}
                onChange={(id) => {
                  if (id === "none") { setContaSel(null); setAtivas([]); setEncerradas([]); return; }
                  supabase.from("contas").select("*").eq("id", id).single().then(({ data }) => {
                    if (data) selecionarConta(data);
                    else toast.error("Conta não encontrada ou sem permissão");
                  });
                }}
                options={contas}
                onSearch={buscarContas}
                loading={buscandoContas}
                placeholder="Buscar conta por nome, telefone ou e-mail..."
                emptyLabel="Selecione a conta"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Leads não podem gerar oportunidade diretamente — converta o lead em Conta primeiro.
              </p>
            </div>
          )}

          {/* Aviso de oportunidade ativa existente */}
          {contaSel && ativas.length > 0 && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
              <p className="text-sm flex items-start gap-2 font-medium text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                Esta conta já possui {ativas.length === 1 ? "uma oportunidade aberta" : `${ativas.length} oportunidades abertas`}:
              </p>
              <ul className="text-xs space-y-1 pl-6">
                {ativas.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-1.5">
                    <a
                      href={`/crm/oportunidades?op=${o.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium hover:underline"
                    >
                      {o.titulo}
                    </a>
                    <Badge variant="outline" className="text-[10px]">{estagioLabel(o.estagio)}</Badge>
                    <span className="text-muted-foreground">
                      resp.: {corretores.find((c) => c.id === o.corretor_id)?.nome ?? "—"} · criada em {format(new Date(o.created_at), "dd/MM/yyyy")}
                    </span>
                  </li>
                ))}
              </ul>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={confirmarOutra} onCheckedChange={(v) => setConfirmarOutra(!!v)} />
                É uma busca realmente diferente — criar outra oportunidade
              </label>
            </div>
          )}

          {contaSel && encerradas.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Esta conta já teve {encerradas.length} oportunidade{encerradas.length > 1 ? "s" : ""} encerrada{encerradas.length > 1 ? "s" : ""}
              {" "}({encerradas.map((o) => `${o.titulo} · ${estagioLabel(o.estagio)}`).join("; ")}).
            </p>

          )}

          <div>
            <Label>Título *</Label>
            <Input value={f("titulo")} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex: Casa 3M no Jardim Europa" />
          </div>

          <div>
            <Label>O que o cliente busca</Label>
            <Textarea value={f("descricao_busca")} onChange={(e) => set("descricao_busca", e.target.value)} placeholder="Casa 4 quartos, com piscina, área nobre..." rows={3} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Valor alvo (R$)</Label>
              <Input type="number" value={f("valor_alvo")} onChange={(e) => set("valor_alvo", e.target.value)} placeholder="3000000" />
            </div>
            <div>
              <Label>Tipo de imóvel</Label>
              <Input value={f("tipo_imovel")} onChange={(e) => set("tipo_imovel", e.target.value)} placeholder="Casa" />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={f("prioridade") || "media"} onValueChange={(v) => set("prioridade", v)}>
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
              <Input value={f("cidade")} onChange={(e) => set("cidade", e.target.value)} />
            </div>
            <div>
              <Label>Bairro, região ou condomínio</Label>
              <Input value={f("bairro")} onChange={(e) => set("bairro", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Forma de pagamento</Label>
              <Input value={f("forma_pagamento")} onChange={(e) => set("forma_pagamento", e.target.value)} placeholder="À vista, financiamento..." />
            </div>
            <div>
              <Label>Prazo pretendido para compra</Label>
              <Input value={f("prazo_pretendido")} onChange={(e) => set("prazo_pretendido", e.target.value)} placeholder="Ex: 3 meses" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={!!form.possui_permuta} onCheckedChange={(v) => set("possui_permuta", !!v)} />
              Cliente tem imóvel para permuta
            </label>
            {form.possui_permuta && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <Label>Imóvel oferecido em permuta</Label>
                  <Input value={f("imovel_permuta")} onChange={(e) => set("imovel_permuta", e.target.value)} placeholder="Ex: Apto no Zurique, mobiliado" />
                </div>
                <div>
                  <Label>Valor estimado da permuta (R$)</Label>
                  <Input type="number" value={f("valor_estimado_permuta")} onChange={(e) => set("valor_estimado_permuta", e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div>
            <Label>Características indispensáveis</Label>
            <Textarea value={f("caracteristicas_indispensaveis")} onChange={(e) => set("caracteristicas_indispensaveis", e.target.value)} rows={2} placeholder="Ex: 4 suítes, aceita pets, sol da manhã..." />
          </div>

          <div>
            <Label>Corretor responsável</Label>
            <SearchableSelect value={f("corretor_id") || "none"} onChange={(v) => set("corretor_id", v)} options={corretores} placeholder="Buscar corretor..." emptyLabel="Sem responsável" />
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
            <Textarea value={f("observacoes")} onChange={(e) => set("observacoes", e.target.value)} rows={2} />
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
