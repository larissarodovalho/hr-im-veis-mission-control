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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Download, Trash2, FileSpreadsheet, FileText, Building2, ArrowRight, Handshake, Plus, X, Check } from "lucide-react";
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

import { formatBRL } from "@/lib/format";
const fmt = (v: number | null) => (v == null || v === 0 ? "—" : formatBRL(v));

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
  // Hidratação inicial dos filtros a partir da URL (mantém ao voltar do detalhe)
  const initialStatus = (() => {
    const v = searchParams.get("status");
    return (v === "ativo" || v === "inativo" || v === "lead") ? (v as Status) : "todos";
  })();
  const initialType = (() => {
    const v = searchParams.get("tipo");
    return (v === "cliente" || v === "parceiro") ? v : "todas";
  })();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<"todos" | Status>(initialStatus as any);
  const [interestFilter, setInterestFilter] = useState<string>(searchParams.get("interesse") ?? "todos");
  const [typeFilter, setTypeFilter] = useState<"todas" | "cliente" | "parceiro">(initialType as any);
  const [tempFilter, setTempFilter] = useState<string>(searchParams.get("temp") ?? "todos");
  const [ownerFilter, setOwnerFilter] = useState<string>(searchParams.get("responsavel") ?? "todos");
  // Rascunho — não filtra até clicar em Aplicar
  const [draftSearch, setDraftSearch] = useState(searchParams.get("q") ?? "");
  const [draftStatus, setDraftStatus] = useState<"todos" | Status>(initialStatus as any);
  const [draftInterest, setDraftInterest] = useState<string>(searchParams.get("interesse") ?? "todos");
  const [draftType, setDraftType] = useState<"todas" | "cliente" | "parceiro">(initialType as any);
  const [draftTemp, setDraftTemp] = useState<string>(searchParams.get("temp") ?? "todos");
  const [draftOwner, setDraftOwner] = useState<string>(searchParams.get("responsavel") ?? "todos");

  const [loading, setLoading] = useState(true);
  const [novaOpen, setNovaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const interestLabel = (v: string | null | undefined) => {
    if (!v) return "";
    const map: Record<string, string> = INTEREST_LABEL as any;
    return map[v] ?? v;
  };
  const tempLabel = (v: string | null | undefined) => tempInfo(v ?? "")?.label ?? "";
  const ownerLabel = (v: string) =>
    v === "none" ? "Sem responsável" : (ownerMap[v] ?? owners.find((o) => o.id === v)?.nome ?? v);

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

  const isDirty =
    draftSearch !== search ||
    draftStatus !== statusFilter ||
    draftInterest !== interestFilter ||
    draftType !== typeFilter ||
    draftTemp !== tempFilter ||
    draftOwner !== ownerFilter;

  const syncFiltersToUrl = (vals: {
    q: string; status: string; interesse: string; tipo: string; temp: string; responsavel: string;
  }) => {
    const sp = new URLSearchParams(searchParams);
    const set = (key: string, value: string, def: string) => {
      if (value && value !== def) sp.set(key, value);
      else sp.delete(key);
    };
    set("q", vals.q, "");
    set("status", vals.status, "todos");
    set("interesse", vals.interesse, "todos");
    set("tipo", vals.tipo, "todas");
    set("temp", vals.temp, "todos");
    set("responsavel", vals.responsavel, "todos");
    setSearchParams(sp, { replace: true });
  };

  const applyFilters = () => {
    setSearch(draftSearch);
    setStatusFilter(draftStatus);
    setInterestFilter(draftInterest);
    setTypeFilter(draftType);
    setTempFilter(draftTemp);
    setOwnerFilter(draftOwner);
    syncFiltersToUrl({
      q: draftSearch, status: draftStatus, interesse: draftInterest,
      tipo: draftType, temp: draftTemp, responsavel: draftOwner,
    });
  };

  const clearFilters = () => {
    setDraftSearch(""); setDraftStatus("todos"); setDraftInterest("todos");
    setDraftType("todas"); setDraftTemp("todos"); setDraftOwner("todos");
    setSearch(""); setStatusFilter("todos"); setInterestFilter("todos");
    setTypeFilter("todas"); setTempFilter("todos"); setOwnerFilter("todos");
    syncFiltersToUrl({ q: "", status: "todos", interesse: "todos", tipo: "todas", temp: "todos", responsavel: "todos" });
  };


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
    if (ownerFilter !== "todos") {
      if (ownerFilter === "none") {
        if (a.responsavel_id) return false;
      } else if (a.responsavel_id !== ownerFilter) return false;
    }
    if (typeFilter === "cliente" && a.is_partner) return false;
    if (typeFilter === "parceiro" && !a.is_partner) return false;
    const accProps = propsByAccount[a.id] ?? [];
    if (!search) return true;
    const s = search.toLowerCase();
    const propMatch = accProps.some(
      (p) => (p.nome_fazenda?.toLowerCase().includes(s) ?? false) || (p.regiao?.toLowerCase().includes(s) ?? false)
    );
    const tagMatch = (a.tags ?? []).some((t) => t.toLowerCase().includes(s));
    return (
      a.nome.toLowerCase().includes(s) ||
      (a.email?.toLowerCase().includes(s) ?? false) ||
      (a.telefone?.includes(search) ?? false) ||
      (a.interesse?.toLowerCase().includes(s) ?? false) ||
      (a.ramo_atividade?.toLowerCase().includes(s) ?? false) ||
      tagMatch ||
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

  type ColKey =
    | "nome" | "telefone" | "email" | "documento" | "responsavel" | "tipo" | "status" | "criado_em"
    | "interesse" | "temperatura" | "tags" | "ramo" | "etapa" | "observacoes" | "endereco"
    | "valor_negocio" | "valor_comissao";
  const COLUMNS: { key: ColKey; label: string; default?: boolean }[] = [
    { key: "nome", label: "Nome", default: true },
    { key: "telefone", label: "Telefone", default: true },
    { key: "email", label: "Email", default: true },
    { key: "documento", label: "CPF/CNPJ", default: true },
    { key: "responsavel", label: "Responsável", default: true },
    { key: "tipo", label: "Tipo", default: true },
    { key: "status", label: "Status", default: true },
    { key: "criado_em", label: "Criado em", default: true },
    { key: "interesse", label: "Interesse" },
    { key: "temperatura", label: "Temperatura" },
    { key: "tags", label: "Tags" },
    { key: "ramo", label: "Ramo de atividade" },
    { key: "etapa", label: "Etapa do funil" },
    { key: "observacoes", label: "Observações" },
    { key: "endereco", label: "Endereço" },
    { key: "valor_negocio", label: "Valor total negócios" },
    { key: "valor_comissao", label: "Valor total comissão" },
  ];
  const COLS_KEY = "contas:export:cols";
  const FMT_KEY = "contas:export:format";
  const [exportCols, setExportCols] = useState<ColKey[]>(() => {
    try {
      const raw = localStorage.getItem(COLS_KEY);
      if (raw) return JSON.parse(raw) as ColKey[];
    } catch {}
    return COLUMNS.filter((c) => c.default).map((c) => c.key);
  });
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">(() => {
    try { return (localStorage.getItem(FMT_KEY) as any) || "xlsx"; } catch { return "xlsx"; }
  });
  const toggleExportCol = (k: ColKey) =>
    setExportCols((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  const buildExportRows = (cols: ColKey[]) => {
    return filtered.map((a) => {
      const status = (a.status ?? "ativo") as Status;
      const accProps = propsByAccount[a.id] ?? [];
      const totalNeg = accProps.reduce((s, p) => s + (p.valor_negocio ?? 0), 0);
      const totalCom = accProps.reduce((s, p) => s + (p.valor_comissao ?? 0), 0);
      const full: Record<ColKey, any> = {
        nome: a.nome,
        telefone: a.telefone ?? "",
        email: a.email ?? "",
        documento: a.documento ? formatDoc(a.documento, a.tipo) : "",
        responsavel: a.responsavel_id ? (ownerMap[a.responsavel_id] ?? "") : "",
        tipo: a.is_partner ? "Parceiro" : "Cliente",
        status: status === "ativo" ? "Ativo" : "Inativo",
        criado_em: format(new Date(a.created_at), "dd/MM/yyyy", { locale: ptBR }),
        interesse: a.interesse ?? "",
        temperatura: tempInfo(a.temperatura)?.label ?? "",
        tags: (a.tags ?? []).join(", "),
        ramo: a.ramo_atividade ?? "",
        etapa: a.etapa_funil ?? "",
        observacoes: a.observacoes ?? "",
        endereco: (a as any).endereco ?? "",
        valor_negocio: totalNeg || "",
        valor_comissao: totalCom || "",
      };
      const out: Record<string, any> = {};
      cols.forEach((k) => {
        const label = COLUMNS.find((c) => c.key === k)?.label ?? k;
        out[label] = full[k];
      });
      return out;
    });
  };

  const runExport = () => {
    if (!filtered.length) return toast.error("Nenhuma conta para exportar");
    if (!exportCols.length) return toast.error("Selecione ao menos uma coluna");
    try { localStorage.setItem(COLS_KEY, JSON.stringify(exportCols)); } catch {}
    try { localStorage.setItem(FMT_KEY, exportFormat); } catch {}
    const rows = buildExportRows(exportCols);
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Array(Object.keys(rows[0] || {}).length).fill({ wch: 20 });
    if (exportFormat === "xlsx") {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Contas");
      XLSX.writeFile(wb, `contas-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Arquivo Excel gerado");
    } else {
      const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contas-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Arquivo CSV gerado");
    }
    setExportOpen(false);
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

  const changeTemperatura = async (id: string, temp: string | null) => {
    const prev = accounts;
    setAccounts((cur) => cur.map((a) => (a.id === id ? { ...a, temperatura: temp } : a)));
    const { error } = await supabase.from("contas").update({ temperatura: temp } as any).eq("id", id);
    if (error) {
      setAccounts(prev);
      toast.error("Não foi possível alterar temperatura: " + error.message);
    } else {
      toast.success("Temperatura atualizada");
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
            <Button onClick={() => setExportOpen(true)}>
              <Download className="h-4 w-4 mr-1" /> Exportar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          <div className="relative lg:col-span-1 sm:col-span-2 lg:col-start-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, tag, interesse, profissão…"
              className="pl-8 w-full"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
            />
          </div>
          <Select value={draftType} onValueChange={(v: any) => setDraftType(v)}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os tipos</SelectItem>
              <SelectItem value="cliente">Apenas clientes</SelectItem>
              <SelectItem value="parceiro">Apenas parceiros</SelectItem>
            </SelectContent>
          </Select>
          <Select value={draftInterest} onValueChange={(v: any) => setDraftInterest(v)}>
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
          <Select value={draftStatus} onValueChange={(v: any) => setDraftStatus(v)}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={draftTemp} onValueChange={(v) => setDraftTemp(v)}>
            <SelectTrigger><SelectValue placeholder="Temperatura" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas temperaturas</SelectItem>
              {TEMPERATURAS.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.emoji} {t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={draftOwner} onValueChange={(v) => setDraftOwner(v)}>
            <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os responsáveis</SelectItem>
              <SelectItem value="none">Sem responsável</SelectItem>
              {owners.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={applyFilters} disabled={!isDirty}>
            <Check className="h-4 w-4 mr-1" /> Aplicar filtros
          </Button>
          <Button size="sm" variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" /> Limpar
          </Button>
          {isDirty && (
            <span className="text-xs text-amber-600">Filtros não aplicados — clique em Aplicar</span>
          )}
          {/* Chips de filtros ativos */}
          {[
            typeFilter !== "todas" && { label: `Tipo: ${typeFilter === "cliente" ? "Clientes" : "Parceiros"}`, clear: () => { setTypeFilter("todas"); setDraftType("todas"); syncFiltersToUrl({ q: search, status: statusFilter, interesse: interestFilter, tipo: "todas", temp: tempFilter, responsavel: ownerFilter }); } },
            interestFilter !== "todos" && { label: `Interesse: ${interestFilter === "none" ? "Não definido" : interestFilter}`, clear: () => { setInterestFilter("todos"); setDraftInterest("todos"); syncFiltersToUrl({ q: search, status: statusFilter, interesse: "todos", tipo: typeFilter, temp: tempFilter, responsavel: ownerFilter }); } },
            statusFilter !== "todos" && { label: `Status: ${statusFilter === "ativo" ? "Ativos" : "Inativos"}`, clear: () => { setStatusFilter("todos"); setDraftStatus("todos"); syncFiltersToUrl({ q: search, status: "todos", interesse: interestFilter, tipo: typeFilter, temp: tempFilter, responsavel: ownerFilter }); } },
            tempFilter !== "todos" && { label: `Temperatura: ${tempLabel(tempFilter)}`, clear: () => { setTempFilter("todos"); setDraftTemp("todos"); syncFiltersToUrl({ q: search, status: statusFilter, interesse: interestFilter, tipo: typeFilter, temp: "todos", responsavel: ownerFilter }); } },
            ownerFilter !== "todos" && { label: `Responsável: ${ownerLabel(ownerFilter)}`, clear: () => { setOwnerFilter("todos"); setDraftOwner("todos"); syncFiltersToUrl({ q: search, status: statusFilter, interesse: interestFilter, tipo: typeFilter, temp: tempFilter, responsavel: "todos" }); } },
            search && { label: `Busca: "${search}"`, clear: () => { setSearch(""); setDraftSearch(""); syncFiltersToUrl({ q: "", status: statusFilter, interesse: interestFilter, tipo: typeFilter, temp: tempFilter, responsavel: ownerFilter }); } },
          ].filter(Boolean).map((chip: any, i) => (

            <Badge key={i} variant="outline" className="gap-1 pl-2 pr-1 py-1">
              {chip.label}
              <button onClick={chip.clear} className="ml-1 rounded-sm hover:bg-muted p-0.5" aria-label="Remover">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
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

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Exportar relatório</DialogTitle>
            <DialogDescription>
              Escolha as colunas que devem aparecer no arquivo. Serão exportadas <strong>{filtered.length}</strong> contas (resultado atual dos filtros).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Colunas ({exportCols.length})</span>
                <div className="flex gap-2 text-xs">
                  <button className="text-primary hover:underline" onClick={() => setExportCols(COLUMNS.map((c) => c.key))}>Todas</button>
                  <button className="text-muted-foreground hover:underline" onClick={() => setExportCols(COLUMNS.filter((c) => c.default).map((c) => c.key))}>Padrão</button>
                  <button className="text-muted-foreground hover:underline" onClick={() => setExportCols([])}>Nenhuma</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
                {COLUMNS.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={exportCols.includes(c.key)}
                      onCheckedChange={() => toggleExportCol(c.key)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Formato</Label>
              <RadioGroup value={exportFormat} onValueChange={(v: any) => setExportFormat(v)} className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="xlsx" /> Excel (.xlsx)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="csv" /> CSV
                </label>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>Cancelar</Button>
            <Button onClick={runExport} disabled={!exportCols.length || !filtered.length}>
              <Download className="h-4 w-4 mr-1" /> Baixar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {view === "kanban" && lista !== "todos" ? (
        loading ? (
          <Card className="p-6 text-center text-muted-foreground hidden md:block">Carregando…</Card>
        ) : (
          <div className="hidden md:block">
            <ContasKanban accounts={filtered as any} propsByAccount={propsByAccount} onMoveStage={moveStage} onChangeOwner={changeOwner} onChangeTemperatura={changeTemperatura} ownerMap={ownerMap} owners={owners} />
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
