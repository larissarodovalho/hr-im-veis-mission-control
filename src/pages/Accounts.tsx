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

type Operation = "compra" | "venda" | "arrendamento" | "outro";
type Status = "ativo" | "inativo";
type Interest = "compra" | "venda" | "arrendamento" | "compra_arrendamento" | "outro";
type Aptitude = "agricultura" | "pecuaria" | "arrendamento" | "misto" | "outro";

type Account = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  status: Status | null;
  observacoes: string | null;
  created_at: string;
  interesse: Interest | null;
  is_partner: boolean | null;
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
  const canDelete = isAdmin || isGestor;
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | Status>("todos");
  const [interestFilter, setInterestFilter] = useState<"todos" | Interest>("todos");
  const [aptitudeFilter, setAptitudeFilter] = useState<"todas" | Aptitude>("todas");
  const [typeFilter, setTypeFilter] = useState<"todas" | "cliente" | "parceiro">("todas");
  const [loading, setLoading] = useState(true);
  const [novaOpen, setNovaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: accs, error }, { data: props }] = await Promise.all([
      supabase.from("contas").select("id, nome, email, telefone, status, observacoes, created_at, interesse, is_partner").order("created_at", { ascending: false }),
      supabase.from("conta_propriedades" as any).select("*"),
    ]);
    if (error) toast.error(error.message);
    setAccounts(((accs as any) ?? []) as Account[]);
    setProperties(((props as any) ?? []) as Property[]);
    setLoading(false);
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
    const status = (a.status ?? "ativo") as Status;
    if (statusFilter !== "todos" && status !== statusFilter) return false;
    if (interestFilter !== "todos" && a.interesse !== interestFilter) return false;
    if (typeFilter === "cliente" && a.is_partner) return false;
    if (typeFilter === "parceiro" && !a.is_partner) return false;
    const accProps = propsByAccount[a.id] ?? [];
    if (aptitudeFilter !== "todas" && !accProps.some((p) => p.aptidao === aptitudeFilter)) return false;
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
    const rows: any[] = [];
    filtered.forEach((a) => {
      const accProps = propsByAccount[a.id] ?? [];
      const status = (a.status ?? "ativo") as Status;
      const baseRow = {
        Cliente: a.nome,
        Tipo: a.is_partner ? "Parceiro" : "Cliente",
        Interesse: a.interesse ? INTEREST_LABEL[a.interesse] : "",
        Telefone: a.telefone ?? "",
        Email: a.email ?? "",
      };
      if (accProps.length === 0) {
        rows.push({
          ...baseRow,
          Operação: "", Aptidão: "", Fazenda: "", Região: "",
          "Tamanho (ha)": "", "Valor do negócio (R$)": "", "Comissão (R$)": "",
          Status: status === "ativo" ? "Ativo" : "Inativo",
          "Convertido em": format(new Date(a.created_at), "dd/MM/yyyy", { locale: ptBR }),
          Observações: a.observacoes ?? "",
        });
      } else {
        accProps.forEach((p) => {
          rows.push({
            ...baseRow,
            Operação: p.operacao ? OP_LABEL[p.operacao] : "",
            Aptidão: p.aptidao ? APT_LABEL[p.aptidao] : "",
            Fazenda: p.nome_fazenda ?? "",
            Região: p.regiao ?? "",
            "Tamanho (ha)": p.tamanho_ha ?? "",
            "Valor do negócio (R$)": p.valor_negocio ?? "",
            "Comissão (R$)": p.valor_comissao ?? "",
            Status: status === "ativo" ? "Ativo" : "Inativo",
            "Convertido em": format(new Date(a.created_at), "dd/MM/yyyy", { locale: ptBR }),
            Observações: p.observacoes ?? a.observacoes ?? "",
          });
        });
      }
    });
    return rows;
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
              {filtered.length} de {accounts.length} · Negócios: <strong>{fmt(totalValue || null)}</strong> · Comissões: <strong>{fmt(totalCommission || null)}</strong>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
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
              <SelectItem value="compra">Comprar</SelectItem>
              <SelectItem value="venda">Vender</SelectItem>
              <SelectItem value="compra_arrendamento">Comprar e arrendar</SelectItem>
              <SelectItem value="arrendamento">Arrendamento</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={aptitudeFilter} onValueChange={(v: any) => setAptitudeFilter(v)}>
            <SelectTrigger><SelectValue placeholder="Aptidão" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as aptidões</SelectItem>
              <SelectItem value="agricultura">Agricultura</SelectItem>
              <SelectItem value="pecuaria">Pecuária</SelectItem>
              <SelectItem value="arrendamento">Arrendamento</SelectItem>
              <SelectItem value="misto">Misto</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
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
        </div>
      </header>

      <NovaContaDialog open={novaOpen} onOpenChange={setNovaOpen} onCreated={load} />
      <ImportarContasDialog open={importOpen} onOpenChange={setImportOpen} onImported={load} />

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
            const accProps = propsByAccount[a.id] ?? [];
            const ops = Array.from(new Set(accProps.map((p) => p.operacao).filter(Boolean))) as Operation[];
            const apts = Array.from(new Set(accProps.map((p) => p.aptidao).filter(Boolean))) as Aptitude[];
            const totalVal = accProps.reduce((s, p) => s + (p.valor_negocio ?? 0), 0);
            const totalCom = accProps.reduce((s, p) => s + (p.valor_comissao ?? 0), 0);
            const status = (a.status ?? "ativo") as Status;
            return (
              <Card key={a.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/app/contas/${a.id}`} className="font-medium hover:underline truncate">{a.nome}</Link>
                      {a.is_partner && (
                        <Badge className="bg-accent/20 text-accent-foreground border-accent/40 border text-[10px]">
                          <Handshake className="h-3 w-3 mr-1" /> Parceiro
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{a.telefone || a.email || "—"}</div>
                  </div>
                  <Badge className={status === "ativo" ? "bg-success/15 text-success border-success/30 border shrink-0" : "bg-muted text-muted-foreground border shrink-0"}>
                    {status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {a.interesse && (
                  <div className="text-xs"><span className="text-muted-foreground">Interesse: </span><span className="font-medium">{INTEREST_LABEL[a.interesse]}</span></div>
                )}
                {(ops.length > 0 || apts.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {ops.map((o) => <Badge key={"o" + o} className={OP_BADGE[o] + " border text-[10px]"}>{OP_LABEL[o]}</Badge>)}
                    {apts.map((ap) => <Badge key={"a" + ap} className={APT_BADGE[ap] + " border text-[10px]"}>{APT_LABEL[ap]}</Badge>)}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">Propriedades</div><div className="font-medium">{accProps.length}</div></div>
                  <div><div className="text-xs text-muted-foreground">Convertido</div><div className="text-xs">{format(new Date(a.created_at), "dd/MM/yyyy", { locale: ptBR })}</div></div>
                  <div><div className="text-xs text-muted-foreground">Valor total</div><div className="font-medium">{fmt(totalVal || null)}</div></div>
                  <div><div className="text-xs text-muted-foreground">Comissão</div><div>{fmt(totalCom || null)}</div></div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link to={`/app/contas/${a.id}`} className="flex-1">
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
                          <AlertDialogDescription>Tem certeza que deseja excluir <strong>{a.nome}</strong>? Todas as propriedades vinculadas também serão removidas. Esta ação não pode ser desfeita.</AlertDialogDescription>
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
      <Card className="overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Cliente</th>
                <th className="p-3">Interesse</th>
                <th className="p-3">Operação / Aptidão</th>
                <th className="p-3">Propriedades</th>
                <th className="p-3 text-right">Valor total</th>
                <th className="p-3 text-right">Comissão</th>
                <th className="p-3">Status</th>
                <th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">{accounts.length === 0 ? "Nenhuma conta ainda. Converta um lead para criar a primeira conta." : "Nenhuma conta corresponde aos filtros."}</td></tr>
              ) : (
                filtered.map((a) => {
                  const accProps = propsByAccount[a.id] ?? [];
                  const ops = Array.from(new Set(accProps.map((p) => p.operacao).filter(Boolean))) as Operation[];
                  const apts = Array.from(new Set(accProps.map((p) => p.aptidao).filter(Boolean))) as Aptitude[];
                  const totalVal = accProps.reduce((s, p) => s + (p.valor_negocio ?? 0), 0);
                  const totalCom = accProps.reduce((s, p) => s + (p.valor_comissao ?? 0), 0);
                  const status = (a.status ?? "ativo") as Status;
                  return (
                    <tr key={a.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/app/contas/${a.id}`} className="font-medium hover:underline">{a.nome}</Link>
                          {a.is_partner && (
                            <Badge className="bg-accent/20 text-accent-foreground border-accent/40 border text-[10px]">
                              <Handshake className="h-3 w-3 mr-1" /> Parceiro
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{a.telefone || a.email || "—"}</div>
                      </td>
                      <td className="p-3">
                        {a.interesse ? <Badge variant="outline" className="text-[10px]">{INTEREST_LABEL[a.interesse]}</Badge> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3">
                        {ops.length === 0 && apts.length === 0 ? <span className="text-muted-foreground">—</span> : (
                          <div className="flex flex-wrap gap-1">
                            {ops.map((o) => <Badge key={"o" + o} className={OP_BADGE[o] + " border text-[10px]"}>{OP_LABEL[o]}</Badge>)}
                            {apts.map((ap) => <Badge key={"a" + ap} className={APT_BADGE[ap] + " border text-[10px]"}>{APT_LABEL[ap]}</Badge>)}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{accProps.length}</div>
                        {accProps.length > 0 && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{accProps.map((p) => p.nome_fazenda || "Sem nome").join(", ")}</div>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">{fmt(totalVal || null)}</td>
                      <td className="p-3 text-right">{fmt(totalCom || null)}</td>
                      <td className="p-3">
                        <Badge className={status === "ativo" ? "bg-success/15 text-success border-success/30 border" : "bg-muted text-muted-foreground border"}>
                          {status === "ativo" ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Link to={`/app/contas/${a.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowRight className="h-4 w-4" /></Button></Link>
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                                  <AlertDialogDescription>Tem certeza que deseja excluir <strong>{a.nome}</strong>? Todas as propriedades vinculadas também serão removidas. Esta ação não pode ser desfeita.</AlertDialogDescription>
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
