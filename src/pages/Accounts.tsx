import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Download, Trash2, FileSpreadsheet, FileText, Building2, ArrowRight, Handshake, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import * as XLSX from "xlsx";
import NovaContaDialog from "@/components/contas/NovaContaDialog";
import ImportarContasDialog from "@/components/contas/ImportarContasDialog";
import ContasKanban from "@/components/contas/ContasKanban";
import { EtapaFunil } from "@/lib/contasFunil";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { TEMPERATURAS, tempInfo } from "@/lib/contasTemperatura";

type Operation = "compra" | "venda" | "arrendamento" | "outro";
type Status = "ativo" | "inativo";
type Interest = "compra" | "venda" | "arrendamento" | "compra_arrendamento" | "outro";
type Aptitude = "agricultura" | "pecuaria" | "arrendamento" | "misto" | "outro";

type Account = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  documento: string | null;
  tipo: "PF" | "PJ" | null;
  responsavel_id: string | null;
  status: Status | null;
  observacoes: string | null;
  created_at: string;
  interesse: Interest | null;
  is_partner: boolean | null;
  tags: string[] | null;
  etapa_funil: string | null;
  temperatura: string | null;
  ramo_atividade: string | null;
};

const formatDoc = (doc: string | null, tipo: string | null) => {
  if (!doc) return "—";
  const d = doc.replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return doc;
};

type Property = {
  id: string;
  conta_id: string;
  operacao: Operation | null;
  aptidao: Aptitude | null;
  nome_fazenda: string | null;
  regiao: string | null;
  tamanho_ha: number | null;
  valor_negocio: number | null;
  valor_comissao: number | null;
  observacoes: string | null;
};

const OP_LABEL: Record<Operation, string> = {
  compra: "Compra",
  venda: "Venda",
  arrendamento: "Arrendamento",
  outro: "Outro",
};

const OP_BADGE: Record<Operation, string> = {
  compra: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  venda: "bg-success/15 text-success border-success/30",
  arrendamento: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  outro: "bg-muted text-muted-foreground",
};

const INTEREST_LABEL: Record<Interest, string> = {
  compra: "Comprar",
  venda: "Vender",
  arrendamento: "Arrendamento",
  compra_arrendamento: "Comprar e arrendar",
  outro: "Outro",
};

const APT_LABEL: Record<Aptitude, string> = {
  agricultura: "Agricultura",
  pecuaria: "Pecuária",
  arrendamento: "Arrendamento",
  misto: "Misto",
  outro: "Outro",
};

const APT_BADGE: Record<Aptitude, string> = {
  agricultura: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  pecuaria: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  arrendamento: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  misto: "bg-violet-500/15 text-violet-700 border-violet-500/30",
  outro: "bg-muted text-muted-foreground",
};

const fmt = (v: number | null) =>
  v == null || v === 0 ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function Accounts() {
  const { isAdmin, isGestor } = useRole();
  const canDelete = isAdmin;
  const [searchParams, setSearchParams] = useSearchParams();
  const listaParam = searchParams.get("lista");
  const lista = (listaParam === "marketing" ? "marketing" : listaParam === "carteira" ? "carteira" : "todos") as "todos" | "carteira" | "marketing";
  const setLista = (v: "todos" | "carteira" | "marketing") => {
    const sp = new URLSearchParams(searchParams);
    sp.set("lista", v);
    setSearchParams(sp, { replace: true });
  };
  const viewParam = searchParams.get("view");
  const view: "kanban" | "lista" =
    lista === "todos" ? "lista" : viewParam === "lista" ? "lista" : "kanban";
  const setView = (v: "kanban" | "lista") => {
    const sp = new URLSearchParams(searchParams);
    sp.set("view", v);
    setSearchParams(sp, { replace: true });
  };
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | Status>("todos");
  const [interestFilter, setInterestFilter] = useState<string>("todos");
  const [typeFilter, setTypeFilter] = useState<"todas" | "cliente" | "parceiro">("todas");
  const [tempFilter, setTempFilter] = useState<string>("todos");
  const [ownerFilter, setOwnerFilter] = useState<string>("todos");
  const [loading, setLoading] = useState(true);
  const [novaOpen, setNovaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [ownerMap, setOwnerMap] = useState<Record<string, string>>({});
  const [owners, setOwners] = useState<{ id: string; nome: string }[]>([]);

  const fetchAllContas = async () => {
    const PAGE = 1000;
    let from = 0;
    const all: any[] = [];
    while (true) {
      const { data, error } = await supabase
        .from("contas")
        .select("id, nome, email, telefone, documento, tipo, responsavel_id, status, observacoes, created_at, interesse, is_partner, tags, etapa_funil, temperatura, ramo_atividade")
        .order("nome", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data?.length) break;
      all.push(...data);
      if (data.length < PAGE) break;
      from += PAGE;
    }
    return all;
  };

  const load = async () => {
    setLoading(true);
    try {
      const [accs, { data: props }, { data: profs }] = await Promise.all([
        fetchAllContas(),
        supabase.from("conta_propriedades" as any).select("*"),
        supabase.from("profiles").select("user_id, nome"),
      ]);
      setAccounts((accs ?? []) as Account[]);
      setProperties(((props as any) ?? []) as Property[]);
      const map: Record<string, string> = {};
      const list: { id: string; nome: string }[] = [];
      ((profs as any) ?? []).forEach((p: any) => {
        if (p.user_id) {
          map[p.user_id] = p.nome || "—";
          list.push({ id: p.user_id, nome: p.nome || "—" });
        }
      });
      list.sort((a, b) => a.nome.localeCompare(b.nome));
      setOwnerMap(map);
      setOwners(list);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("accounts-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "contas" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "conta_propriedades" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const propsByAccount = properties.reduce<Record<string, Property[]>>((acc, p) => {
    (acc[p.conta_id] ??= []).push(p);
    return acc;
  }, {});

  const filtered = accounts.filter((a) => {
    if (lista !== "todos") {
      const tags = (a.tags ?? []).map((t) => t.toLowerCase());
      if (!tags.includes(lista)) return false;
    }
    const status = (a.status ?? "ativo") as Status;
    if (statusFilter !== "todos" && status !== statusFilter) return false;
    if (interestFilter !== "todos") {
      if (interestFilter === "none") {
        if (a.interesse) return false;
      } else if (a.interesse !== interestFilter) return false;
    }
    if (tempFilter !== "todos" && (a.temperatura || "") !== tempFilter) return false;
    if (typeFilter === "cliente" && a.is_partner) return false;
    if (typeFilter === "parceiro" && !a.is_partner) return false;
    const accProps = propsByAccount[a.id] ?? [];
    if (!search) return true;
    const s = search.toLowerCase();
    const propMatch = accProps.some(
      (p) => (p.nome_fazenda?.toLowerCase().includes(s) ?? false) || (p.regiao?.toLowerCase().includes(s) ?? false)
    );
    return (
      a.nome.toLowerCase().includes(s) ||
      (a.email?.toLowerCase().includes(s) ?? false) ||
      (a.telefone?.includes(search) ?? false) ||
      propMatch
    );
  });

  const totalValue = filtered.reduce(
    (sum, a) => sum + (propsByAccount[a.id] ?? []).reduce((s, p) => s + (p.valor_negocio ?? 0), 0),
    0
  );
  const totalCommission = filtered.reduce(
    (sum, a) => sum + (propsByAccount[a.id] ?? []).reduce((s, p) => s + (p.valor_comissao ?? 0), 0),
    0
  );

  const buildExportRows = () => {
    return filtered.map((a) => {
      const status = (a.status ?? "ativo") as Status;
      return {
        Nome: a.nome,
        Telefone: a.telefone ?? "",
        Email: a.email ?? "",
        "CPF/CNPJ": a.documento ? formatDoc(a.documento, a.tipo) : "",
        Proprietário: a.responsavel_id ? (ownerMap[a.responsavel_id] ?? "") : "",
        Tipo: a.is_partner ? "Parceiro" : "Cliente",
        Status: status === "ativo" ? "Ativo" : "Inativo",
        "Criado em": format(new Date(a.created_at), "dd/MM/yyyy", { locale: ptBR }),
      };
    });
  };

  const exportXlsx = () => {
    if (!filtered.length) return toast.error("Nenhuma conta para exportar");
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Array(Object.keys(rows[0] || {}).length).fill({ wch: 18 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contas");
    XLSX.writeFile(wb, `contas-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Arquivo Excel gerado");
  };

  const exportCsv = () => {
    if (!filtered.length) return toast.error("Nenhuma conta para exportar");
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contas-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Arquivo CSV gerado");
  };

  const changeOwner = async (id: string, userId: string | null) => {
    const prev = accounts;
    setAccounts((cur) => cur.map((a) => (a.id === id ? { ...a, responsavel_id: userId } : a)));
    const { error } = await supabase.from("contas").update({ responsavel_id: userId } as any).eq("id", id);
    if (error) {
      setAccounts(prev);
      toast.error("Não foi possível alterar responsável: " + error.message);
    } else {
      toast.success("Responsável atualizado");
    }
  };

  const moveStage = async (id: string, etapa: EtapaFunil) => {
    const prev = accounts;
    setAccounts((cur) => cur.map((a) => (a.id === id ? { ...a, etapa_funil: etapa } : a)));
    const { error } = await supabase.from("contas").update({ etapa_funil: etapa } as any).eq("id", id);
    if (error) {
      setAccounts(prev);
      toast.error("Não foi possível mover: " + error.message);
    }
  };

  const remove = async (id: string, name: string) => {
    const { error } = await supabase.from("contas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Conta "${name}" excluída`);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold flex items-center gap-2">
              <Building2 className="h-6 w-6 md:h-7 md:w-7 text-primary" /> Contas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} de {accounts.length} contas
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Importar
            </Button>
            <Button variant="outline" onClick={() => setNovaOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nova conta
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button><Download className="h-4 w-4 mr-1" /> Exportar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportXlsx}><FileSpreadsheet className="h-4 w-4 mr-2" /> Excel (.xlsx)</DropdownMenuItem>
                <DropdownMenuItem onClick={exportCsv}><FileText className="h-4 w-4 mr-2" /> CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative lg:col-span-1 sm:col-span-2 lg:col-start-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar nome, fazenda, região…" className="pl-8 w-full" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os tipos</SelectItem>
              <SelectItem value="cliente">Apenas clientes</SelectItem>
              <SelectItem value="parceiro">Apenas parceiros</SelectItem>
            </SelectContent>
          </Select>
          <Select value={interestFilter} onValueChange={(v: any) => setInterestFilter(v)}>
            <SelectTrigger><SelectValue placeholder="Interesse" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os interesses</SelectItem>
              <SelectItem value="none">Não definido</SelectItem>
              <SelectItem value="Comprar">Comprar</SelectItem>
              <SelectItem value="Vender">Vender</SelectItem>
              <SelectItem value="Alugar">Alugar</SelectItem>
              <SelectItem value="Incorporar">Incorporar</SelectItem>
              <SelectItem value="Investimento">Investimento</SelectItem>
              <SelectItem value="Ocasião de oportunidade">Ocasião de oportunidade</SelectItem>
              <SelectItem value="Permuta">Permuta</SelectItem>
              <SelectItem value="Arquiteto">Arquiteto</SelectItem>
              <SelectItem value="Construtor">Construtor</SelectItem>
              <SelectItem value="Corretor parceiro">Corretor parceiro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tempFilter} onValueChange={(v) => setTempFilter(v)}>
            <SelectTrigger><SelectValue placeholder="Temperatura" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas temperaturas</SelectItem>
              {TEMPERATURAS.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.emoji} {t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={lista} onValueChange={(v) => setLista(v as "todos" | "carteira" | "marketing")}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="carteira">Carteira</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
          </TabsList>
        </Tabs>
        {lista !== "todos" && (
          <div className="hidden md:inline-flex rounded-md border bg-background p-0.5">
            <Button
              variant={view === "kanban" ? "secondary" : "ghost"}
              size="sm"
              className="h-8"
              onClick={() => setView("kanban")}
            >
              <LayoutGrid className="h-4 w-4 mr-1" /> Kanban
            </Button>
            <Button
              variant={view === "lista" ? "secondary" : "ghost"}
              size="sm"
              className="h-8"
              onClick={() => setView("lista")}
            >
              <ListIcon className="h-4 w-4 mr-1" /> Lista
            </Button>
          </div>
        )}
      </div>

      <NovaContaDialog open={novaOpen} onOpenChange={setNovaOpen} onCreated={load} defaultTags={lista === "todos" ? [] : [lista]} />
      <ImportarContasDialog open={importOpen} onOpenChange={setImportOpen} onImported={load} defaultTags={lista === "todos" ? [] : [lista]} />

      {view === "kanban" && lista !== "todos" ? (
        loading ? (
          <Card className="p-6 text-center text-muted-foreground hidden md:block">Carregando…</Card>
        ) : (
          <div className="hidden md:block">
            <ContasKanban accounts={filtered as any} propsByAccount={propsByAccount} onMoveStage={moveStage} onChangeOwner={changeOwner} ownerMap={ownerMap} owners={owners} />
          </div>
        )
      ) : null}

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <Card className="p-6 text-center text-muted-foreground">Carregando…</Card>
        ) : filtered.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            {accounts.length === 0 ? "Nenhuma conta ainda. Converta um lead para criar a primeira conta." : "Nenhuma conta corresponde aos filtros."}
          </Card>
        ) : (
          filtered.map((a) => {
            const status = (a.status ?? "ativo") as Status;
            const owner = a.responsavel_id ? (ownerMap[a.responsavel_id] ?? "—") : "—";
            return (
              <Card key={a.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/crm/contas/${a.id}`} className="font-medium hover:underline truncate">{a.nome}</Link>
                      {a.is_partner && (
                        <Badge className="bg-accent/20 text-accent-foreground border-accent/40 border text-[10px]">
                          <Handshake className="h-3 w-3 mr-1" /> Parceiro
                        </Badge>
                      )}
                      {(() => {
                        const t = tempInfo(a.temperatura);
                        return t ? (
                          <Badge variant="outline" className={`${t.badge} text-[10px]`}>{t.emoji} {t.label}</Badge>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <Badge className={status === "ativo" ? "bg-success/15 text-success border-success/30 border shrink-0" : "bg-muted text-muted-foreground border shrink-0"}>
                    {status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div><span className="text-xs text-muted-foreground">Telefone: </span><span>{a.telefone || "—"}</span></div>
                  <div className="truncate"><span className="text-xs text-muted-foreground">E-mail: </span><span>{a.email || "—"}</span></div>
                  <div><span className="text-xs text-muted-foreground">CPF/CNPJ: </span><span>{formatDoc(a.documento, a.tipo)}</span></div>
                  <div>
                    <span className="text-xs text-muted-foreground">Qualificação: </span>
                    {(() => {
                      const tags = (a.tags ?? []).map((t) => t.toLowerCase());
                      const q = tags.includes("carteira") ? "carteira" : tags.includes("marketing") ? "marketing" : null;
                      return q ? (
                        <Badge variant="outline" className={q === "carteira" ? "bg-blue-500/15 text-blue-700 border-blue-500/30" : "bg-pink-500/15 text-pink-700 border-pink-500/30"}>
                          {q === "carteira" ? "Carteira" : "Marketing"}
                        </Badge>
                      ) : <span className="text-muted-foreground">—</span>;
                    })()}
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Interesse: </span>
                    {a.interesse ? (
                      <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-500/30">{a.interesse}</Badge>
                    ) : <span className="text-muted-foreground">—</span>}
                  </div>
                  <div><span className="text-xs text-muted-foreground">Responsável: </span><span>{owner}</span></div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link to={`/crm/contas/${a.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">Abrir <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
                  </Link>
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                          <AlertDialogDescription>Tem certeza que deseja excluir <strong>{a.nome}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(a.id, a.nome)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop */}
      <Card className={`overflow-hidden ${view === "kanban" && lista !== "todos" ? "hidden" : "hidden md:block"}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Telefone</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">CPF/CNPJ</th>
                <th className="p-3">Qualificação</th>
                <th className="p-3">Interesse</th>
                <th className="p-3">Responsável</th>
                <th className="p-3">Status</th>
                <th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="p-10 text-center text-muted-foreground">{accounts.length === 0 ? "Nenhuma conta ainda. Converta um lead para criar a primeira conta." : "Nenhuma conta corresponde aos filtros."}</td></tr>
              ) : (
                filtered.map((a) => {
                  const status = (a.status ?? "ativo") as Status;
                  const owner = a.responsavel_id ? (ownerMap[a.responsavel_id] ?? "—") : "—";
                  return (
                    <tr key={a.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/crm/contas/${a.id}`} className="font-medium hover:underline">{a.nome}</Link>
                          {a.is_partner && (
                            <Badge className="bg-accent/20 text-accent-foreground border-accent/40 border text-[10px]">
                              <Handshake className="h-3 w-3 mr-1" /> Parceiro
                            </Badge>
                          )}
                          {(() => {
                            const t = tempInfo(a.temperatura);
                            return t ? (
                              <Badge variant="outline" className={`${t.badge} text-[10px]`}>{t.emoji} {t.label}</Badge>
                            ) : null;
                          })()}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">{a.telefone || <span className="text-muted-foreground">—</span>}</td>
                      <td className="p-3">{a.email || <span className="text-muted-foreground">—</span>}</td>
                      <td className="p-3 whitespace-nowrap">{a.documento ? formatDoc(a.documento, a.tipo) : <span className="text-muted-foreground">—</span>}</td>
                      <td className="p-3">
                        {(() => {
                          const tags = (a.tags ?? []).map((t) => t.toLowerCase());
                          const q = tags.includes("carteira") ? "carteira" : tags.includes("marketing") ? "marketing" : null;
                          return q ? (
                            <Badge variant="outline" className={q === "carteira" ? "bg-blue-500/15 text-blue-700 border-blue-500/30" : "bg-pink-500/15 text-pink-700 border-pink-500/30"}>
                              {q === "carteira" ? "Carteira" : "Marketing"}
                            </Badge>
                          ) : <span className="text-muted-foreground">—</span>;
                        })()}
                      </td>
                      <td className="p-3">
                        {a.interesse ? (
                          <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-500/30">{a.interesse}</Badge>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3">{owner === "—" ? <span className="text-muted-foreground">—</span> : owner}</td>
                      <td className="p-3">
                        <Badge className={status === "ativo" ? "bg-success/15 text-success border-success/30 border" : "bg-muted text-muted-foreground border"}>
                          {status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Link to={`/crm/contas/${a.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowRight className="h-4 w-4" /></Button></Link>
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                                  <AlertDialogDescription>Tem certeza que deseja excluir <strong>{a.nome}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => remove(a.id, a.nome)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
