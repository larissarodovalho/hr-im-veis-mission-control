import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Copy, Ban, Share2, Eye, Users, MessageCircle, CalendarCheck, Link2, Timer, BarChart3,
  RefreshCw, Trash2, ListTree, ExternalLink, Smartphone, Repeat,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { fmtDateTime } from "@/lib/datetime";
import { useAuth } from "@/contexts/AuthContext";
import LinkMetricasDialog from "@/components/imoveis/LinkMetricasDialog";
import LinkDetalhesDialog from "@/components/imoveis/LinkDetalhesDialog";
import CompartilharAcoes from "@/components/imoveis/CompartilharAcoes";
import CompartilharImovelDialog from "@/components/imoveis/CompartilharImovelDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { copiarTexto, registrarEventoInterno } from "@/lib/imovelLinkShare";
import {
  estadoAtual, tempoRestante, urlDoLink, revogarLink, excluirLink, marcarSubstituido,
  statusUI, STATUS_LABEL, type LinkCompartilhado, type LinkStatusUI,
} from "@/lib/imovelLinks";

const POR_PAGINA = 20;

type Resumo = {
  whatsapp: number;
  visita: number;
  gostei: number;
  rejeitou: number;
  dispositivo: string | null;
};

const STATUS_CLASSE: Partial<Record<LinkStatusUI, string>> = {
  ativo: "bg-emerald-500/90 text-white border-0",
  aberto: "bg-emerald-600/90 text-white border-0",
  aguardando_inicio: "bg-sky-500/90 text-white border-0",
  proximo_expirar: "bg-amber-500/90 text-white border-0",
  nao_aberto: "bg-zinc-400/90 text-white border-0",
  expirado: "bg-zinc-500/90 text-white border-0",
  revogado: "bg-destructive text-destructive-foreground border-0",
  substituido: "bg-amber-600/90 text-white border-0",
  convertido_interesse: "bg-primary text-primary-foreground border-0",
  convertido_oportunidade: "bg-primary text-primary-foreground border-0",
  convertido_venda: "bg-primary text-primary-foreground border-0",
};

export default function LinksCompartilhadosTab() {
  const navigate = useNavigate();
  const { user, roles, isAdmin, isGestor } = useAuth();
  const isMarketing = roles?.includes("marketing" as never) ?? false;
  const isSecretaria = !isAdmin && !isGestor && !isMarketing && (roles?.includes("secretaria" as never) ?? false);

  const [links, setLinks] = useState<LinkCompartilhado[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [itens, setItens] = useState<Record<string, { titulo: string; imovelId: string }[]>>({});
  const [resumos, setResumos] = useState<Record<string, Resumo>>({});
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [contas, setContas] = useState<Record<string, string>>({});
  const [oportunidades, setOportunidades] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Filtros (aplicados no servidor sempre que possível)
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("all");
  const [corretorFiltro, setCorretorFiltro] = useState("all");
  const [tipoFiltro, setTipoFiltro] = useState("all");
  const [periodo, setPeriodo] = useState("all");
  const [aberturaFiltro, setAberturaFiltro] = useState("all");
  const [dispositivoFiltro, setDispositivoFiltro] = useState("all");
  const [resultadoFiltro, setResultadoFiltro] = useState("all");
  const [ordem, setOrdem] = useState("created_desc");

  // Diálogos
  const [compartilhar, setCompartilhar] = useState<LinkCompartilhado | null>(null);
  const [metricasDe, setMetricasDe] = useState<LinkCompartilhado | null>(null);
  const [detalhesDe, setDetalhesDe] = useState<LinkCompartilhado | null>(null);
  const [renovar, setRenovar] = useState<LinkCompartilhado | null>(null);

  const tituloDe = (l: LinkCompartilhado) =>
    l.titulo_selecao || itens[l.id]?.[0]?.titulo || "Imóvel";

  const conversaoDe = useCallback(
    (l: LinkCompartilhado): "interesse" | "oportunidade" | null => {
      const r = resumos[l.id];
      if (l.oportunidade_id) return "oportunidade";
      if (r && r.gostei > 0) return "interesse";
      return null;
    },
    [resumos],
  );

  const load = useCallback(async () => {
    if (isSecretaria) { setLoading(false); return; }
    setLoading(true);
    try { await supabase.rpc("imovel_links_expirados_sem_abertura" as any); } catch { /* não bloqueia */ }

    let query = supabase
      .from("imovel_links_compartilhados")
      .select("*", { count: "exact" });

    if (corretorFiltro !== "all") query = query.eq("corretor_id", corretorFiltro);
    if (tipoFiltro !== "all") query = query.eq("tipo", tipoFiltro);
    if (aberturaFiltro === "abertos") query = query.not("primeiro_acesso_em", "is", null);
    if (aberturaFiltro === "nao_abertos") query = query.is("primeiro_acesso_em", null);
    if (periodo !== "all") {
      const dias = Number(periodo);
      const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
      query = query.gte("created_at", desde);
    }
    if (status === "revogado") query = query.eq("estado_operacional", "revogado");
    if (status === "substituido") query = query.eq("estado_operacional", "substituido");

    const termo = busca.trim();
    if (termo) {
      // Busca por código/título do link ou por imóvel/código do imóvel.
      const { data: ims } = await supabase
        .from("imoveis")
        .select("id")
        .or(`titulo.ilike.%${termo}%,codigo.ilike.%${termo}%`)
        .limit(100);
      const imIds = (ims ?? []).map((i: any) => i.id);
      let linkIds: string[] = [];
      if (imIds.length) {
        const { data: its } = await supabase
          .from("imovel_link_itens").select("link_id").in("imovel_id", imIds).limit(500);
        linkIds = Array.from(new Set((its ?? []).map((i: any) => i.link_id)));
      }
      const ors = [`codigo_referencia.ilike.%${termo}%`, `titulo_selecao.ilike.%${termo}%`];
      if (linkIds.length) ors.push(`id.in.(${linkIds.join(",")})`);
      query = query.or(ors.join(","));
    }

    const asc = ordem === "created_asc";
    const col = ordem.startsWith("acesso") ? "ultimo_acesso_em" : ordem.startsWith("expira") ? "expira_em" : "created_at";
    query = query.order(col, { ascending: ordem === "expira_asc" ? true : asc, nullsFirst: false });
    query = query.range(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA - 1);

    const { data: ls, count } = await query;
    const lista = (ls ?? []) as unknown as LinkCompartilhado[];
    setLinks(lista);
    setTotal(count ?? 0);

    const ids = lista.map((l) => l.id);
    if (ids.length) {
      const [{ data: its }, { data: evs }, { data: profs }] = await Promise.all([
        supabase.from("imovel_link_itens").select("link_id, imovel_id, ordem").in("link_id", ids),
        // Somente as colunas necessárias dos eventos da página atual
        supabase.from("imovel_link_eventos").select("link_id, tipo_evento, dispositivo").in("link_id", ids),
        supabase.from("profiles").select("user_id,nome"),
      ]);

      const imIds = Array.from(new Set((its ?? []).map((i: any) => i.imovel_id)));
      const { data: ims } = imIds.length
        ? await supabase.from("imoveis").select("id,titulo,codigo").in("id", imIds)
        : { data: [] as any[] };
      const titulos: Record<string, string> = {};
      (ims ?? []).forEach((i: any) => { titulos[i.id] = i.codigo ? `${i.titulo} (${i.codigo})` : i.titulo; });

      const mapItens: Record<string, { titulo: string; imovelId: string }[]> = {};
      (its ?? []).forEach((i: any) => {
        (mapItens[i.link_id] ||= []).push({ titulo: titulos[i.imovel_id] || "Imóvel", imovelId: i.imovel_id });
      });
      setItens(mapItens);

      const mapRes: Record<string, Resumo> = {};
      const disp: Record<string, Record<string, number>> = {};
      (evs ?? []).forEach((e: any) => {
        const r = (mapRes[e.link_id] ||= { whatsapp: 0, visita: 0, gostei: 0, rejeitou: 0, dispositivo: null });
        if (e.tipo_evento === "clique_whatsapp") r.whatsapp++;
        if (e.tipo_evento === "solicitou_visita" || e.tipo_evento === "pedido_visita") r.visita++;
        if (e.tipo_evento === "gostei") r.gostei++;
        if (e.tipo_evento === "rejeitou") r.rejeitou++;
        if (e.dispositivo) {
          const d = (disp[e.link_id] ||= {});
          d[e.dispositivo] = (d[e.dispositivo] || 0) + 1;
        }
      });
      Object.entries(disp).forEach(([id, d]) => {
        const principal = Object.entries(d).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        (mapRes[id] ||= { whatsapp: 0, visita: 0, gostei: 0, rejeitou: 0, dispositivo: null }).dispositivo = principal;
      });
      setResumos(mapRes);

      const pm: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { if (p.user_id) pm[p.user_id] = p.nome || "—"; });
      setProfiles(pm);

      const contaIds = Array.from(new Set(lista.map((l) => l.conta_id).filter(Boolean))) as string[];
      const opIds = Array.from(new Set(lista.map((l) => l.oportunidade_id).filter(Boolean))) as string[];
      const [{ data: cs }, { data: os }] = await Promise.all([
        contaIds.length ? supabase.from("contas").select("id,nome").in("id", contaIds) : Promise.resolve({ data: [] as any[] }),
        opIds.length ? supabase.from("oportunidades").select("id,titulo").in("id", opIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const cm: Record<string, string> = {};
      (cs ?? []).forEach((c: any) => { cm[c.id] = c.nome || "Conta"; });
      setContas(cm);
      const om: Record<string, string> = {};
      (os ?? []).forEach((o: any) => { om[o.id] = o.titulo || "Oportunidade"; });
      setOportunidades(om);
    } else {
      setItens({}); setResumos({});
    }
    setLoading(false);
  }, [busca, status, corretorFiltro, tipoFiltro, periodo, aberturaFiltro, ordem, pagina, isSecretaria]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPagina(0); }, [busca, status, corretorFiltro, tipoFiltro, periodo, aberturaFiltro, ordem]);

  // Filtros que dependem de eventos são aplicados sobre a página carregada
  const filtrados = useMemo(() => {
    return links.filter((l) => {
      const r = resumos[l.id];
      const st = statusUI(l, conversaoDe(l));
      if (status !== "all" && status !== "revogado" && status !== "substituido" && st !== status) return false;
      if (dispositivoFiltro !== "all" && (r?.dispositivo ?? "") !== dispositivoFiltro) return false;
      if (resultadoFiltro === "interesse" && !(r?.gostei)) return false;
      if (resultadoFiltro === "rejeitado" && !(r?.rejeitou)) return false;
      if (resultadoFiltro === "visita" && !(r?.visita)) return false;
      if (resultadoFiltro === "sem_retorno" && (r?.gostei || r?.rejeitou || r?.visita || r?.whatsapp)) return false;
      return true;
    });
  }, [links, resumos, status, dispositivoFiltro, resultadoFiltro, conversaoDe]);

  const corretoresLista = useMemo(
    () => Object.entries(profiles).sort((a, b) => a[1].localeCompare(b[1])),
    [profiles],
  );

  const kpis = useMemo(() => {
    const ativos = filtrados.filter((l) => estadoAtual(l) === "ativo").length;
    const acessos = filtrados.reduce((s, l) => s + (l.total_acessos || 0), 0);
    const unicos = filtrados.reduce((s, l) => s + (l.visitantes_unicos || 0), 0);
    const visitas = filtrados.reduce((s, l) => s + (resumos[l.id]?.visita || 0), 0);
    return { ativos, acessos, unicos, visitas };
  }, [filtrados, resumos]);

  const copiar = async (l: LinkCompartilhado) => {
    if (estadoAtual(l) !== "ativo") return toast.error("Link não está mais ativo — gere um novo link");
    const ok = await copiarTexto(urlDoLink(l.token));
    if (!ok) return toast.error("Não foi possível copiar o link");
    registrarEventoInterno(l.id, "copia_link_interno");
    toast.success("Link copiado");
  };

  const revogar = async (l: LinkCompartilhado) => {
    if (!confirm(`Revogar o link ${l.codigo_referencia}? O cliente perde o acesso imediatamente.`)) return;
    try { await revogarLink(l.id, "Revogado pelo CRM"); toast.success("Link revogado"); load(); }
    catch (e: any) { toast.error(e?.message || "Erro ao revogar"); }
  };

  const substituir = async (l: LinkCompartilhado) => {
    if (!confirm("Marcar este link como substituído? Ele deixa de funcionar e permanece no histórico.")) return;
    try { await marcarSubstituido(l.id); toast.success("Link marcado como substituído"); load(); }
    catch (e: any) { toast.error(e?.message || "Erro ao marcar substituição"); }
  };

  const excluir = async (l: LinkCompartilhado) => {
    if (!confirm(`Excluir definitivamente o link ${l.codigo_referencia}? Os eventos de auditoria são preservados.`)) return;
    try { await excluirLink(l.id); toast.success("Link excluído"); load(); }
    catch (e: any) { toast.error(e?.message || "Sem permissão para excluir"); }
  };

  if (isSecretaria) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Seu perfil não tem acesso à central de links compartilhados.
      </Card>
    );
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Links ativos", value: kpis.ativos, icon: Link2 },
          { label: "Aberturas", value: kpis.acessos, icon: Eye },
          { label: "Visitantes únicos", value: kpis.unicos, icon: Users },
          { label: "Pedidos de visita", value: kpis.visitas, icon: CalendarCheck },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <k.icon className="h-3.5 w-3.5" /> {k.label}
            </div>
            <div className="text-2xl font-semibold mt-1">{k.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="w-full sm:w-64"
          placeholder="Buscar por código, imóvel ou seleção…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {(Object.keys(STATUS_LABEL) as LinkStatusUI[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={corretorFiltro} onValueChange={setCorretorFiltro}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Corretor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os corretores</SelectItem>
            {user?.id && <SelectItem value={user.id}>Meus links</SelectItem>}
            {corretoresLista.map(([id, nome]) => (
              <SelectItem key={id} value={id}>{nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="imovel">Imóvel único</SelectItem>
            <SelectItem value="selecao">Seleção</SelectItem>
          </SelectContent>
        </Select>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o período</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="15">Últimos 15 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={aberturaFiltro} onValueChange={setAberturaFiltro}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Abertura" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Abertos e não abertos</SelectItem>
            <SelectItem value="abertos">Somente abertos</SelectItem>
            <SelectItem value="nao_abertos">Não abertos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dispositivoFiltro} onValueChange={setDispositivoFiltro}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Dispositivo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos dispositivos</SelectItem>
            <SelectItem value="mobile">Celular</SelectItem>
            <SelectItem value="desktop">Computador</SelectItem>
          </SelectContent>
        </Select>
        <Select value={resultadoFiltro} onValueChange={setResultadoFiltro}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Resultado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os resultados</SelectItem>
            <SelectItem value="interesse">Gostou</SelectItem>
            <SelectItem value="rejeitado">Sem interesse</SelectItem>
            <SelectItem value="visita">Pediu visita</SelectItem>
            <SelectItem value="sem_retorno">Sem retorno</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ordem} onValueChange={setOrdem}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created_desc">Mais recentes</SelectItem>
            <SelectItem value="created_asc">Mais antigos</SelectItem>
            <SelectItem value="acesso_desc">Último acesso</SelectItem>
            <SelectItem value="expira_asc">Expiram primeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Carregando…</Card>
      ) : filtrados.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum link encontrado com os filtros atuais. Gere um link pelo botão de compartilhar no card do imóvel.
        </Card>
      ) : (
        <div className="space-y-2">
          {filtrados.map((l) => {
            const r = resumos[l.id] || { whatsapp: 0, visita: 0, gostei: 0, rejeitou: 0, dispositivo: null };
            const st = statusUI(l, conversaoDe(l));
            const ativo = estadoAtual(l) === "ativo";
            const lista = itens[l.id] || [];
            return (
              <Card key={l.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">{tituloDe(l)}</span>
                      <Badge className={`text-[10px] ${STATUS_CLASSE[st] ?? ""}`}>{STATUS_LABEL[st]}</Badge>
                      <Badge variant="outline" className="text-[10px]">{l.codigo_referencia}</Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {l.tipo === "selecao" ? `${lista.length} imóveis` : "Imóvel único"}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Corretor: {profiles[l.corretor_id] || "—"} · Criado em {fmtDateTime(l.created_at)}
                      {l.compartilhado_em && ` · Compartilhado em ${fmtDateTime(l.compartilhado_em)}`}
                      {` · Prazo ${Math.round(l.validade_minutos / 60)}h`}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {l.conta_id && (
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]"
                          onClick={() => navigate(`/crm/contas?conta=${l.conta_id}`)}>
                          <ExternalLink className="h-3 w-3 mr-1" /> {contas[l.conta_id] || "Conta"}
                        </Button>
                      )}
                      {l.oportunidade_id && (
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]"
                          onClick={() => navigate(`/crm/oportunidades?oportunidade=${l.oportunidade_id}`)}>
                          <ExternalLink className="h-3 w-3 mr-1" /> {oportunidades[l.oportunidade_id] || "Oportunidade"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setDetalhesDe(l)}>
                      <ListTree className="h-3.5 w-3.5 mr-1" /> Detalhes
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setMetricasDe(l)}>
                      <BarChart3 className="h-3.5 w-3.5 mr-1" /> Métricas
                    </Button>
                    {ativo && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setCompartilhar(l)}>
                          <Share2 className="h-3.5 w-3.5 mr-1" /> Compartilhar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => copiar(l)}>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => substituir(l)}>
                          <Repeat className="h-3.5 w-3.5 mr-1" /> Substituir
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => revogar(l)}>
                          <Ban className="h-3.5 w-3.5 mr-1" /> Revogar
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setRenovar(l)}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> Gerar novo link
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => excluir(l)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {tempoRestante(l)}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {l.total_acessos} aberturas</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {l.visitantes_unicos} únicos</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {r.whatsapp} WhatsApp</span>
                  <span className="flex items-center gap-1"><CalendarCheck className="h-3 w-3" /> {r.visita} visitas pedidas</span>
                  {r.dispositivo && (
                    <span className="flex items-center gap-1">
                      <Smartphone className="h-3 w-3" /> {r.dispositivo === "mobile" ? "Celular" : "Computador"}
                    </span>
                  )}
                  {r.gostei > 0 && <span className="text-primary">Gostou</span>}
                  {r.rejeitou > 0 && <span className="text-destructive">Sem interesse</span>}
                  <span>Primeiro acesso: {l.primeiro_acesso_em ? fmtDateTime(l.primeiro_acesso_em) : "—"}</span>
                  <span>Último acesso: {l.ultimo_acesso_em ? fmtDateTime(l.ultimo_acesso_em) : "—"}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {total > POR_PAGINA && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{total} links · página {pagina + 1} de {totalPaginas}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
              Anterior
            </Button>
            <Button size="sm" variant="outline" disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}

      <LinkMetricasDialog
        open={!!metricasDe}
        onOpenChange={(v) => { if (!v) setMetricasDe(null); }}
        link={metricasDe}
      />

      <LinkDetalhesDialog
        open={!!detalhesDe}
        onOpenChange={(v) => { if (!v) setDetalhesDe(null); }}
        link={detalhesDe}
        titulo={detalhesDe ? tituloDe(detalhesDe) : ""}
        conta={detalhesDe?.conta_id ? contas[detalhesDe.conta_id] : null}
        oportunidade={detalhesDe?.oportunidade_id ? oportunidades[detalhesDe.oportunidade_id] : null}
        corretor={detalhesDe ? profiles[detalhesDe.corretor_id] : null}
        conversao={detalhesDe ? conversaoDe(detalhesDe) : null}
      />

      <Dialog open={!!compartilhar} onOpenChange={(v) => { if (!v) setCompartilhar(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compartilhar link</DialogTitle>
          </DialogHeader>
          {compartilhar && (
            <CompartilharAcoes
              link={compartilhar}
              titulo={tituloDe(compartilhar)}
              quantidade={(itens[compartilhar.id] || []).length || 1}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Renovar nunca reativa o link antigo: gera um novo e marca o anterior como substituído */}
      <CompartilharImovelDialog
        open={!!renovar}
        onOpenChange={(v) => { if (!v) setRenovar(null); }}
        imoveis={(itens[renovar?.id ?? ""] || []).map((i) => ({ id: i.imovelId, titulo: i.titulo }))}
        contaId={renovar?.conta_id ?? null}
        contaNome={renovar?.conta_id ? contas[renovar.conta_id] : null}
        oportunidadeId={renovar?.oportunidade_id ?? null}
        substituiLinkId={renovar?.id ?? null}
        onCreated={load}
      />
    </div>
  );
}
