// Etapa 15 — Relatório "Performance dos links dos imóveis".
// Toda a agregação acontece no banco (RPC imovel_links_performance); o navegador
// nunca carrega a base de eventos. Horários e agrupamentos por período usam America/Cuiaba.
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Link2, RefreshCw } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { useReportsPeriod } from "@/hooks/useReportsPeriod";
import { pct, tempoMedioLabel, type LinksPerfKpis, type LinksPerfGrupo } from "@/lib/linksReport";

type Payload = {
  escopo?: "completo" | "proprios";
  kpis?: LinksPerfKpis;
  por_corretor?: LinksPerfGrupo[];
  por_imovel?: LinksPerfGrupo[];
  por_bairro?: LinksPerfGrupo[];
  por_tipo_imovel?: LinksPerfGrupo[];
  por_dispositivo?: LinksPerfGrupo[];
  por_duracao?: LinksPerfGrupo[];
  por_periodo?: LinksPerfGrupo[];
};

const COMPARACOES: { valor: keyof Payload; label: string }[] = [
  { valor: "por_duracao", label: "Duração do link" },
  { valor: "por_dispositivo", label: "Dispositivo" },
  { valor: "por_corretor", label: "Corretor" },
  { valor: "por_imovel", label: "Imóvel" },
  { valor: "por_bairro", label: "Bairro" },
  { valor: "por_tipo_imovel", label: "Tipo de imóvel" },
  { valor: "por_periodo", label: "Período (mês)" },
];

export default function LinksImoveisReport() {
  const { inicioISO, fimISO, label } = useReportsPeriod();
  const [dados, setDados] = useState<Payload>({});
  const [loading, setLoading] = useState(true);
  const [corretores, setCorretores] = useState<{ id: string; nome: string }[]>([]);

  const [corretor, setCorretor] = useState("all");
  const [imovel, setImovel] = useState("");
  const [tipo, setTipo] = useState("all");
  const [status, setStatus] = useState("all");
  const [dispositivo, setDispositivo] = useState("all");
  const [resultado, setResultado] = useState("all");
  const [duracao, setDuracao] = useState("all");
  const [comparacao, setComparacao] = useState<keyof Payload>("por_duracao");

  useEffect(() => {
    supabase.from("profiles").select("user_id,nome").then(({ data }) => {
      setCorretores((data ?? []).map((p: any) => ({ id: p.user_id, nome: p.nome || "Sem nome" })));
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const nulo = (v: string) => (v === "all" || !v ? null : v);
    const { data, error } = await supabase.rpc("imovel_links_performance" as any, {
      _inicio: inicioISO,
      _fim: fimISO,
      _corretor: nulo(corretor),
      _imovel: imovel.trim() || null,
      _conta: null,
      _oportunidade: null,
      _tipo: nulo(tipo),
      _status: nulo(status),
      _dispositivo: nulo(dispositivo),
      _resultado: nulo(resultado),
      _duracao: nulo(duracao),
    });
    if (error) toast.error(error.message);
    setDados((data ?? {}) as Payload);
    setLoading(false);
  }, [inicioISO, fimISO, corretor, imovel, tipo, status, dispositivo, resultado, duracao]);

  useEffect(() => { load(); }, [load]);

  const k = dados.kpis;
  const grupos = (dados[comparacao] as LinksPerfGrupo[] | undefined) ?? [];

  const kpiCards = useMemo(() => {
    if (!k) return [];
    return [
      { l: "Links gerados", v: k.gerados },
      { l: "Compartilhamento iniciado", v: k.compartilhados },
      { l: "Envios confirmados", v: k.envios_confirmados },
      { l: "Links abertos", v: k.abertos },
      { l: "Não abertos", v: k.nao_abertos },
      { l: "Expirados sem abertura", v: k.expirados_sem_abertura },
      { l: "Expirados após abertura", v: k.expirados_com_abertura },
      { l: "Total de acessos", v: k.total_acessos },
      { l: "Visitantes únicos", v: k.visitantes_unicos },
      { l: "Cliques no WhatsApp", v: k.cliques_whatsapp },
      { l: "Gostei", v: k.gostei },
      { l: "Rejeições", v: k.rejeicoes },
      { l: "Pedidos de informação", v: k.solicitacoes_info },
      { l: "Pedidos de visita", v: k.solicitacoes_visita },
      { l: "Oportunidades relacionadas", v: k.oportunidades },
      { l: "Vendas relacionadas", v: k.vendas },
      { l: "1º acesso (tempo médio)", v: tempoMedioLabel(k.tempo_medio_min) },
      { l: "Taxa de abertura", v: pct(k.taxa_abertura) },
      { l: "Taxa de interesse", v: pct(k.taxa_interesse) },
      { l: "Taxa de visita", v: pct(k.taxa_visita) },
      { l: "Taxa de conversão", v: pct(k.taxa_conversao) },
    ];
  }, [k]);

  const exportar = () => {
    if (!grupos.length) return toast.error("Nada para exportar");
    const csv = Papa.unparse(
      grupos.map((g) => ({
        Grupo: g.chave,
        "Links gerados": g.gerados,
        Abertos: g.abertos,
        "Taxa de abertura": pct(g.gerados ? (g.abertos * 100) / g.gerados : 0),
        Gostei: g.gostei,
        "Pedidos de visita": g.visitas,
      })),
    );
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `links-imoveis-${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Performance dos links dos imóveis — {label}</h2>
          {dados.escopo === "proprios" && <Badge variant="secondary">Somente meus links</Badge>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportar}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
        <Input placeholder="Imóvel ou código" value={imovel} onChange={(e) => setImovel(e.target.value)} className="h-9" />
        <Select value={corretor} onValueChange={setCorretor}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Corretor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os corretores</SelectItem>
            {corretores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="imovel">Imóvel único</SelectItem>
            <SelectItem value="selecao">Seleção</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="expirado">Expirados</SelectItem>
            <SelectItem value="revogado">Revogados</SelectItem>
            <SelectItem value="substituido">Substituídos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dispositivo} onValueChange={setDispositivo}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Dispositivo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os dispositivos</SelectItem>
            <SelectItem value="celular">Celular</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
            <SelectItem value="desktop">Computador</SelectItem>
          </SelectContent>
        </Select>
        <Select value={duracao} onValueChange={setDuracao}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Duração" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as durações</SelectItem>
            <SelectItem value="30">Até 30 min</SelectItem>
            <SelectItem value="60">1 hora</SelectItem>
            <SelectItem value="90">1h30</SelectItem>
            <SelectItem value="120">2 horas</SelectItem>
            <SelectItem value="personalizado">Personalizado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={resultado} onValueChange={setResultado}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Resultado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os resultados</SelectItem>
            <SelectItem value="gostei">Com "gostei"</SelectItem>
            <SelectItem value="rejeitou">Com recusa</SelectItem>
            <SelectItem value="informacoes">Pediu informações</SelectItem>
            <SelectItem value="visita">Pediu visita</SelectItem>
            <SelectItem value="sem_retorno">Sem retorno</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : !k ? (
        <p className="text-muted-foreground">Sem acesso a este relatório.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
            {kpiCards.map((c) => (
              <div key={c.l} className="rounded-md border p-2">
                <p className="text-[11px] text-muted-foreground leading-tight">{c.l}</p>
                <p className="text-lg font-semibold">{c.v}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Comparar por:</span>
            <Select value={comparacao as string} onValueChange={(v) => setComparacao(v as keyof Payload)}>
              <SelectTrigger className="h-9 w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMPARACOES.map((c) => (
                  <SelectItem key={c.valor as string} value={c.valor as string}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">Gerados</TableHead>
                  <TableHead className="text-right">Abertos</TableHead>
                  <TableHead className="text-right">Taxa de abertura</TableHead>
                  <TableHead className="text-right">Gostei</TableHead>
                  <TableHead className="text-right">Pedidos de visita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupos.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem dados no período.</TableCell></TableRow>
                ) : grupos.map((g) => (
                  <TableRow key={g.chave}>
                    <TableCell className="font-medium whitespace-nowrap">{g.chave}</TableCell>
                    <TableCell className="text-right">{g.gerados}</TableCell>
                    <TableCell className="text-right">{g.abertos}</TableCell>
                    <TableCell className="text-right">{pct(g.gerados ? (g.abertos * 100) / g.gerados : 0)}</TableCell>
                    <TableCell className="text-right">{g.gostei}</TableCell>
                    <TableCell className="text-right">{g.visitas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </Card>
  );
}
