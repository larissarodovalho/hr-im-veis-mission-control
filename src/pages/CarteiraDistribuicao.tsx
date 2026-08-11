import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Plus, Trash2, Shuffle, RefreshCw, CheckCircle2, Search, ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ETAPAS, etapaLabel } from "@/lib/contasFunil";
import {
  buscarElegiveis, contarElegiveis, criarOperacao, usePreviaOperacao, useCorretores, useProfilesMap,
  type ContaElegivel, type FiltrosCarteira, type LoteConfig, type ModoSelecao,
} from "@/hooks/useCarteira";
import AcompanhamentoCarteira from "@/components/carteira/AcompanhamentoCarteira";
import HistoricoDistribuicoes from "@/components/carteira/HistoricoDistribuicoes";

const MODOS: { id: ModoSelecao; titulo: string; desc: string }[] = [
  { id: "automatico", titulo: "Automática aleatória", desc: "O sistema sorteia as contas elegíveis e divide entre os lotes." },
  { id: "manual", titulo: "Manual", desc: "O gestor escolhe as contas em massa, com filtros e busca." },
  { id: "automatico_ajuste", titulo: "Automática com ajustes", desc: "Sorteia e depois permite remover, substituir e mover contas." },
];

const novoLote = (): LoteConfig => ({
  key: Math.random().toString(36).slice(2),
  corretor_id: "",
  quantidade: 100,
  prazoDias: 3,
  objetivo: "",
  observacoes: "",
});

export default function CarteiraDistribuicao() {
  const { user } = useAuth();
  const { isAdmin, isGestor, loading: roleLoading } = useRole();
  const can = isAdmin || isGestor;
  const { corretores } = useCorretores();
  const profiles = useProfilesMap();

  const [aba, setAba] = useState<"distribuir" | "acompanhamento" | "historico">("distribuir");
  const [etapa, setEtapa] = useState<"config" | "selecao">("config");
  const [modo, setModo] = useState<ModoSelecao>("automatico");
  const [lotesCfg, setLotesCfg] = useState<LoteConfig[]>([novoLote(), novoLote()]);
  const [filtros, setFiltros] = useState<FiltrosCarteira>({});
  const [elegiveis, setElegiveis] = useState<ContaElegivel[]>([]);
  const [totalElegiveis, setTotalElegiveis] = useState(0);
  const [carregandoElegiveis, setCarregandoElegiveis] = useState(false);
  const [busca, setBusca] = useState("");
  const [operacaoId, setOperacaoId] = useState<string | null>(null);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [loteDestino, setLoteDestino] = useState<string>("");
  const [buscaLote, setBuscaLote] = useState("");
  const [processando, setProcessando] = useState(false);

  const { lotes, itens, reload } = usePreviaOperacao(operacaoId);

  const totalDefinido = lotesCfg.reduce((s, l) => s + (Number(l.quantidade) || 0), 0);
  const nomeCorretor = (id: string) => corretores.find((c) => c.user_id === id)?.nome ?? profiles[id] ?? "Corretor";

  const recarregarElegiveis = async (f = filtros, q = busca) => {
    setCarregandoElegiveis(true);
    try {
      const [lista, total] = await Promise.all([buscarElegiveis(f, q), contarElegiveis(f, q)]);
      setElegiveis(lista);
      setTotalElegiveis(total);
    } catch (e: any) {
      toast.error("Erro ao buscar contas elegíveis: " + e.message);
    }
    setCarregandoElegiveis(false);
  };

  useEffect(() => { if (can) recarregarElegiveis(); /* eslint-disable-next-line */ }, [can]);
  useEffect(() => { if (lotes.length && !loteDestino) setLoteDestino(lotes[0].id); }, [lotes, loteDestino]);

  const itensPorLote = useMemo(() => {
    const m = new Map<string, typeof itens>();
    lotes.forEach((l) => m.set(l.id, []));
    itens.forEach((i) => { m.set(i.lote_id, [...(m.get(i.lote_id) ?? []), i]); });
    return m;
  }, [itens, lotes]);

  const jaSelecionadas = useMemo(() => new Set(itens.map((i) => i.conta_id)), [itens]);

  if (roleLoading) return <div className="p-4 md:p-8 text-muted-foreground">Carregando…</div>;
  if (!can)
    return (
      <div className="p-4 md:p-8">
        <Card className="p-6 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <p>Apenas gestores e administradores distribuem a carteira.</p>
        </Card>
      </div>
    );

  const iniciarSelecao = async () => {
    if (!user) return;
    const validos = lotesCfg.filter((l) => l.corretor_id);
    if (validos.length < 1) return toast.error("Selecione pelo menos um corretor.");
    if (new Set(validos.map((l) => l.corretor_id)).size !== validos.length)
      return toast.error("Os corretores devem ser diferentes entre si.");
    if (validos.some((l) => !l.quantidade || l.quantidade < 1))
      return toast.error("Informe a quantidade de contas de cada corretor.");
    if (modo !== "manual" && totalDefinido > totalElegiveis)
      return toast.error(
        `Foram encontradas ${totalElegiveis} contas elegíveis, mas são necessárias ${totalDefinido} para esta distribuição.`
      );

    setProcessando(true);
    try {
      const id = await criarOperacao({ modo, filtros, gestorId: user.id, lotes: validos, corretorNome: nomeCorretor });
      setOperacaoId(id);
      setEtapa("selecao");
      if (modo !== "manual") {
        const { data, error } = await supabase.rpc("carteira_gerar_selecao" as any, { _operacao_id: id });
        if (error) throw error;
        const r: any = data;
        toast.success(`Seleção gerada: ${r?.selecionadas ?? 0} contas.`);
        if (r?.faltando > 0) toast.warning(`Faltaram ${r.faltando} contas elegíveis para completar os lotes.`);
      }
      await reload(id);
      await recarregarElegiveis();
    } catch (e: any) {
      toast.error("Erro ao iniciar a distribuição: " + e.message);
    }
    setProcessando(false);
  };

  const gerarNovamente = async () => {
    if (!operacaoId) return;
    setProcessando(true);
    const { data, error } = await supabase.rpc("carteira_gerar_selecao" as any, { _operacao_id: operacaoId });
    if (error) toast.error(error.message);
    else toast.success(`Nova seleção: ${(data as any)?.selecionadas ?? 0} contas.`);
    await reload();
    await recarregarElegiveis();
    setProcessando(false);
  };

  const adicionarAoLote = async () => {
    if (!loteDestino || marcadas.size === 0) return;
    setProcessando(true);
    const { error } = await supabase.rpc("carteira_selecao_adicionar" as any, {
      _lote_id: loteDestino,
      _conta_ids: [...marcadas],
    });
    if (error) toast.error(error.message);
    else toast.success(`${marcadas.size} conta(s) adicionada(s) ao lote.`);
    setMarcadas(new Set());
    await reload();
    await recarregarElegiveis();
    setProcessando(false);
  };

  const removerDaSelecao = async (contaId: string) => {
    if (!operacaoId) return;
    const { error } = await supabase.rpc("carteira_selecao_remover" as any, {
      _operacao_id: operacaoId, _conta_ids: [contaId],
    });
    if (error) toast.error(error.message);
    await reload();
    await recarregarElegiveis();
  };

  const substituirAleatoria = async (contaId: string) => {
    if (!operacaoId) return;
    const { error } = await supabase.rpc("carteira_selecao_substituir" as any, {
      _operacao_id: operacaoId, _conta_id: contaId, _nova_conta_id: null,
    });
    if (error) toast.error(error.message);
    else toast.success("Conta substituída.");
    await reload();
    await recarregarElegiveis();
  };

  const moverPara = async (contaId: string, destino: string) => {
    if (!operacaoId) return;
    const { error } = await supabase.rpc("carteira_selecao_mover" as any, {
      _operacao_id: operacaoId, _conta_id: contaId, _lote_destino: destino,
    });
    if (error) toast.error(error.message);
    await reload();
  };

  const confirmar = async () => {
    if (!operacaoId) return;
    setProcessando(true);
    const { data, error } = await supabase.rpc("carteira_confirmar_distribuicao" as any, { _operacao_id: operacaoId });
    if (error) {
      toast.error("Distribuição não confirmada: " + error.message);
    } else {
      toast.success(`Distribuição confirmada: ${(data as any)?.atribuicoes ?? 0} contas atribuídas.`);
      setOperacaoId(null);
      setEtapa("config");
      setLotesCfg([novoLote(), novoLote()]);
      recarregarElegiveis();
    }
    setProcessando(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold">Distribuição de Carteira</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Distribua contas da carteira HR entre os corretores em lotes independentes, com histórico completo.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          {carregandoElegiveis ? "Calculando…" : `${totalElegiveis} contas elegíveis`}
        </Badge>
      </div>

      <div className="flex gap-2 border-b">
        {([["distribuir","Distribuir"],["acompanhamento","Acompanhamento"],["historico","Histórico"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
              aba === id ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === "acompanhamento" && <AcompanhamentoCarteira profiles={profiles} />}

      {aba === "historico" && <HistoricoDistribuicoes profiles={profiles} />}

      {aba === "distribuir" && etapa === "config" && (
        <>
          <Card className="p-4 md:p-6 space-y-4">
            <h2 className="font-semibold">1. Corretores e quantidades</h2>
            <div className="space-y-4">
              {lotesCfg.map((l, idx) => (
                <div key={l.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border-b pb-4 last:border-0">
                  <div className="md:col-span-4">
                    <Label className="text-xs">Corretor {idx + 1}</Label>
                    <Select
                      value={l.corretor_id}
                      onValueChange={(v) => setLotesCfg((p) => p.map((x) => (x.key === l.key ? { ...x, corretor_id: v } : x)))}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecionar corretor" /></SelectTrigger>
                      <SelectContent>
                        {corretores.map((c) => (
                          <SelectItem key={c.user_id} value={c.user_id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number" min={1} value={l.quantidade}
                      onChange={(e) => setLotesCfg((p) => p.map((x) => (x.key === l.key ? { ...x, quantidade: Number(e.target.value) } : x)))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Prazo 1º contato (dias)</Label>
                    <Input
                      type="number" min={1} value={l.prazoDias}
                      onChange={(e) => setLotesCfg((p) => p.map((x) => (x.key === l.key ? { ...x, prazoDias: Number(e.target.value) } : x)))}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs">Observação interna</Label>
                    <Input
                      value={l.observacoes}
                      onChange={(e) => setLotesCfg((p) => p.map((x) => (x.key === l.key ? { ...x, observacoes: e.target.value } : x)))}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => setLotesCfg((p) => p.filter((x) => x.key !== l.key))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={() => setLotesCfg((p) => [...p, novoLote()])}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar corretor
              </Button>
              <div className="text-sm">
                Total da operação: <span className="font-semibold">{totalDefinido}</span> contas ·{" "}
                <span className={totalDefinido > totalElegiveis ? "text-destructive" : "text-muted-foreground"}>
                  {totalElegiveis} elegíveis
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 space-y-3">
            <h2 className="font-semibold">2. Modo de seleção</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {MODOS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModo(m.id)}
                  className={`text-left rounded-lg border p-4 transition-colors ${
                    modo === m.id ? "border-primary bg-accent" : "hover:bg-accent/50"
                  }`}
                >
                  <p className="font-medium text-sm">{m.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4 md:p-6 space-y-4">
            <h2 className="font-semibold">3. Filtros da carteira</h2>
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select
                  value={filtros.categoria?.[0] ?? "todas"}
                  onValueChange={(v) => setFiltros((f) => ({ ...f, categoria: v === "todas" ? [] : [v] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="carteira">Carteira</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Etapa do funil</Label>
                <Select
                  value={filtros.etapa_funil?.[0] ?? "todas"}
                  onValueChange={(v) => setFiltros((f) => ({ ...f, etapa_funil: v === "todas" ? [] : [v] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {ETAPAS.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Cidade / endereço contém</Label>
                <Input value={filtros.cidade ?? ""} onChange={(e) => setFiltros((f) => ({ ...f, cidade: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Interesse contém</Label>
                <Input value={filtros.interesse ?? ""} onChange={(e) => setFiltros((f) => ({ ...f, interesse: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Responsável atual</Label>
                <Select
                  value={filtros.responsavel_id ?? "qualquer"}
                  onValueChange={(v) => setFiltros((f) => ({ ...f, responsavel_id: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qualquer">Qualquer</SelectItem>
                    <SelectItem value="sem">Sem responsável</SelectItem>
                    {corretores.map((c) => <SelectItem key={c.user_id} value={c.user_id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Sem contato há (dias)</Label>
                <Input
                  type="number" min={1} value={filtros.sem_contato_dias ?? ""}
                  onChange={(e) => setFiltros((f) => ({ ...f, sem_contato_dias: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="semop"
                  checked={!!filtros.sem_oportunidade_ativa}
                  onCheckedChange={(v) => setFiltros((f) => ({ ...f, sem_oportunidade_ativa: !!v }))}
                />
                <Label htmlFor="semop" className="text-xs">Somente sem oportunidade ativa</Label>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => recarregarElegiveis()} disabled={carregandoElegiveis}>
                  {carregandoElegiveis ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
                  Recalcular elegíveis
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Contas elegíveis: ativas, não canceladas, com telefone ou e-mail e sem atribuição ativa em outro lote.
            </p>
          </Card>

          <div className="flex justify-end">
            <Button onClick={iniciarSelecao} disabled={processando}>
              {processando ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Shuffle className="h-4 w-4 mr-1" />}
              {modo === "manual" ? "Iniciar seleção manual" : "Selecionar contas automaticamente"}
            </Button>
          </div>
        </>
      )}

      {aba === "distribuir" && etapa === "selecao" && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Pool de contas elegíveis */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-sm">Carteira elegível ({totalElegiveis})</h2>
                <div className="flex gap-2">
                  <Input
                    className="h-8 w-40" placeholder="Buscar…" value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && recarregarElegiveis(filtros, busca)}
                  />
                  <Button size="sm" variant="outline" onClick={() => recarregarElegiveis(filtros, busca)}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={loteDestino} onValueChange={setLoteDestino}>
                  <SelectTrigger className="h-8 w-56"><SelectValue placeholder="Lote de destino" /></SelectTrigger>
                  <SelectContent>
                    {lotes.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={adicionarAoLote} disabled={!marcadas.size || processando}>
                  Adicionar contas selecionadas ao lote ({marcadas.size})
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMarcadas(new Set(elegiveis.map((e) => e.id)))}>
                  Selecionar todos os resultados
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMarcadas(new Set())}>Limpar</Button>
              </div>
              <div className="max-h-[520px] overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Etapa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {elegiveis.slice(0, 300).map((c) => (
                      <TableRow key={c.id} className={jaSelecionadas.has(c.id) ? "opacity-50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={marcadas.has(c.id)}
                            onCheckedChange={(v) =>
                              setMarcadas((p) => {
                                const n = new Set(p);
                                v ? n.add(c.id) : n.delete(c.id);
                                return n;
                              })
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">{c.nome}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{c.telefone || c.email || "—"}</TableCell>
                        <TableCell className="text-xs">{etapaLabel(c.etapa_funil ?? "")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalElegiveis > elegiveis.length && (
                  <p className="p-2 text-xs text-muted-foreground">
                    Mostrando {Math.min(300, elegiveis.length)} de {totalElegiveis}. Use os filtros ou a busca para refinar.
                  </p>
                )}
              </div>
            </Card>

            {/* Lotes da operação */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-sm">Prévia dos lotes</h2>
                <Input
                  className="h-8 w-40" placeholder="Buscar no lote…"
                  value={buscaLote} onChange={(e) => setBuscaLote(e.target.value)}
                />
              </div>
              <div className="space-y-4 max-h-[560px] overflow-auto pr-1">
                {lotes.map((l) => {
                  const its = (itensPorLote.get(l.id) ?? []).filter((i) =>
                    !buscaLote || (i.conta?.nome ?? "").toLowerCase().includes(buscaLote.toLowerCase())
                  );
                  const total = (itensPorLote.get(l.id) ?? []).length;
                  const falta = l.quantidade_definida - total;
                  return (
                    <div key={l.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{l.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {total} de {l.quantidade_definida} contas · prazo {l.prazo_primeiro_contato_dias} dia(s)
                          </p>
                        </div>
                        {falta > 0 ? (
                          <Badge variant="destructive">{falta} vaga(s)</Badge>
                        ) : falta < 0 ? (
                          <Badge variant="secondary">{Math.abs(falta)} excedente(s)</Badge>
                        ) : (
                          <Badge variant="secondary">Completo</Badge>
                        )}
                      </div>
                      <div className="max-h-56 overflow-auto divide-y">
                        {its.map((i) => (
                          <div key={i.conta_id} className="flex items-center justify-between gap-2 py-1.5">
                            <div className="min-w-0">
                              <p className="text-sm truncate">{i.conta?.nome ?? "Conta"}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {i.conta?.telefone || i.conta?.email || "—"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {lotes.length > 1 && (
                                <Select onValueChange={(v) => moverPara(i.conta_id, v)}>
                                  <SelectTrigger className="h-7 w-7 p-0 justify-center border-none">
                                    <ArrowRightLeft className="h-3.5 w-3.5" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {lotes.filter((x) => x.id !== l.id).map((x) => (
                                      <SelectItem key={x.id} value={x.id}>Mover para {x.nome}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <Button size="icon" variant="ghost" className="h-7 w-7" title="Substituir por outra conta aleatória"
                                onClick={() => substituirAleatoria(i.conta_id)}>
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" title="Remover do lote"
                                onClick={() => removerDaSelecao(i.conta_id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {its.length === 0 && <p className="text-xs text-muted-foreground py-2">Nenhuma conta neste lote.</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => { setOperacaoId(null); setEtapa("config"); }}>
              Cancelar operação
            </Button>
            <div className="flex flex-wrap gap-2">
              {modo !== "manual" && (
                <Button variant="outline" onClick={gerarNovamente} disabled={processando}>
                  <Shuffle className="h-4 w-4 mr-1" /> Gerar nova seleção automática
                </Button>
              )}
              <Button onClick={confirmar} disabled={processando || itens.length === 0}>
                {processando ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Confirmar distribuição dos lotes
              </Button>
            </div>
          </div>
        </>
      )}

      {aba === "distribuir" && <HistoricoOperacoes profiles={profiles} />}
    </div>
  );
}

function HistoricoOperacoes({ profiles }: { profiles: Record<string, string> }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from("carteira_lotes" as any)
      .select("id, nome, corretor_id, gestor_id, quantidade_definida, quantidade_inicial, status, modo, created_at")
      .eq("status", "ativo")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setRows((data ?? []) as any[]));
  }, []);
  if (!rows.length) return null;
  return (
    <Card className="p-4 md:p-6">
      <h2 className="font-semibold mb-3">Lotes ativos</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lote</TableHead><TableHead>Corretor</TableHead><TableHead>Definido</TableHead>
            <TableHead>Atribuído</TableHead><TableHead>Modo</TableHead><TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.nome}</TableCell>
              <TableCell>{profiles[r.corretor_id] ?? "—"}</TableCell>
              <TableCell>{r.quantidade_definida}</TableCell>
              <TableCell>{r.quantidade_inicial}</TableCell>
              <TableCell className="text-xs">{r.modo}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString("pt-BR", { timeZone: "America/Cuiaba" })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
