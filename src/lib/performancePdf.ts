import jsPDF from "jspdf";
import logoHR from "@/assets/brand/hr-imoveis-logo.png";
import { fmtDateTime } from "@/lib/datetime";
import { categoriaDe, etapaLabel } from "@/lib/contasFunil";
import { nextTaskCountdown } from "@/lib/tarefas";

export type ListaPerformance = "carteira" | "marketing" | "todas";

export interface PerfConta { id: string; etapa_funil: string | null; tags: string[] | null; categoria: string | null; responsavel_id: string | null }
export interface PerfTarefa { conta_id: string | null; prazo: string | null }
export interface PerfOportunidade { corretor_id: string | null; estagio?: string | null }
export interface PerfLead { corretor_id: string | null }

export interface PerformanceCorretor {
  user_id: string;
  nome: string;
  total: number;
  emAndamento: number;
  semRetorno: number;
  cancelados: number;
  estabelecidos: number;
  programado: number;
  atrasada: number;
  porEtapa: Array<{ id: string; label: string; qtd: number; conversao: number | null }>;
  oportunidades: number;
  ganhas: number;
  perdidas: number;
  taxaGanho: number | null;
  leads: number;
  temLeads: boolean;
}

const FLUXO = ["a_contatar", "contatado", "contato_estabelecido"];
const ETAPAS_PDF = ["a_contatar", "contatado", "contato_estabelecido", "sem_retorno", "contato_cancelado"];

export const LISTA_LABEL: Record<ListaPerformance, string> = { carteira: "Carteira", marketing: "Marketing", todas: "Todas" };

export function filtrarContas(contas: PerfConta[], lista: ListaPerformance, corretor?: string) {
  return contas.filter((c) => {
    if (corretor && corretor !== "todos" && c.responsavel_id !== corretor) return false;
    return lista === "todas" || categoriaDe(c as any) === lista;
  });
}

export function primeiraTarefaPorConta(tarefas: PerfTarefa[]) {
  const m = new Map<string, string>();
  [...tarefas]
    .filter((t) => t.conta_id && t.prazo)
    .sort((a, b) => String(a.prazo).localeCompare(String(b.prazo)))
    .forEach((t) => { if (!m.has(t.conta_id!)) m.set(t.conta_id!, t.prazo!); });
  return m;
}

export function calcularPerformance(p: {
  userId: string; nome: string; lista: ListaPerformance; contas: PerfConta[];
  tarefaPorConta: Map<string, string>; opsGeradas: PerfOportunidade[]; opsEncerradas: PerfOportunidade[];
  leads: PerfLead[]; temLeads: boolean;
}): PerformanceCorretor {
  const base = filtrarContas(p.contas, p.lista, p.userId);
  const by: Record<string, number> = {};
  let programado = 0, atrasada = 0;
  base.forEach((c) => {
    const e = c.etapa_funil || "a_contatar";
    by[e] = (by[e] ?? 0) + 1;
    if (e === "contato_cancelado" || e === "sem_retorno") return;
    const prazo = p.tarefaPorConta.get(c.id);
    const cd = prazo ? nextTaskCountdown(prazo) : null;
    if (!cd) return;
    if (cd.tom === "atrasada") atrasada++; else programado++;
  });
  const acum: Record<string, number> = {};
  for (let i = FLUXO.length - 1; i >= 0; i--) acum[FLUXO[i]] = (by[FLUXO[i]] ?? 0) + (acum[FLUXO[i + 1]] ?? 0);
  const porEtapa = ETAPAS_PDF.map((id) => {
    const i = FLUXO.indexOf(id);
    const conv = i >= 0 && i < FLUXO.length - 1 && acum[id] > 0 ? (acum[FLUXO[i + 1]] / acum[id]) * 100 : null;
    return { id, label: etapaLabel(id), qtd: by[id] ?? 0, conversao: conv };
  });
  const ganhas = p.opsEncerradas.filter((o) => o.corretor_id === p.userId && o.estagio === "ganha").length;
  const perdidas = p.opsEncerradas.filter((o) => o.corretor_id === p.userId && o.estagio === "perdida").length;
  const semRetorno = by.sem_retorno ?? 0, cancelados = by.contato_cancelado ?? 0;
  return {
    user_id: p.userId, nome: p.nome, total: base.length,
    emAndamento: base.length - semRetorno - cancelados, semRetorno, cancelados,
    estabelecidos: by.contato_estabelecido ?? 0, programado, atrasada, porEtapa,
    oportunidades: p.opsGeradas.filter((o) => o.corretor_id === p.userId).length,
    ganhas, perdidas, taxaGanho: ganhas + perdidas ? (ganhas / (ganhas + perdidas)) * 100 : null,
    leads: p.leads.filter((l) => l.corretor_id === p.userId).length, temLeads: p.temLeads,
  };
}

async function carregarLogo(): Promise<string | null> {
  try {
    const r = await fetch(logoHR);
    const b = await r.blob();
    return await new Promise((res) => { const f = new FileReader(); f.onload = () => res(f.result as string); f.readAsDataURL(b); });
  } catch { return null; }
}

const fmtPct = (n: number | null) => (n == null ? "—" : `${n.toFixed(1).replace(".", ",")}%`);

export async function gerarPdfPerformance({ corretores, periodo, lista }: { corretores: PerformanceCorretor[]; periodo: string; lista: ListaPerformance }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await carregarLogo();
  const W = doc.internal.pageSize.getWidth();
  const M = 15;

  corretores.forEach((c, idx) => {
    if (idx > 0) doc.addPage();
    if (logo) doc.addImage(logo, "PNG", M, 12, 18, 21, undefined, "FAST");
    const x = logo ? 37 : M;
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(90);
    doc.text("HR IMÓVEIS · RELATÓRIO INDIVIDUAL DE PERFORMANCE", x, 17);
    doc.setFontSize(18); doc.setTextColor(20);
    doc.text(c.nome, x, 26);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(90);
    doc.text(`Período: ${periodo}  ·  Lista: ${LISTA_LABEL[lista]}  ·  Gerado em ${fmtDateTime(new Date())}`, x, 32);
    doc.setDrawColor(200); doc.line(M, 38, W - M, 38);

    let y = 46;
    const secao = (t: string) => { doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(20); doc.text(t, M, y); y += 6; };
    const kpis = (itens: Array<[string, string | number]>) => {
      const cols = 3, w = (W - 2 * M - (cols - 1) * 4) / cols, h = 16;
      itens.forEach(([l, v], i) => {
        const cx = M + (i % cols) * (w + 4), cy = y + Math.floor(i / cols) * (h + 4);
        doc.setDrawColor(220); doc.roundedRect(cx, cy, w, h, 2, 2);
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100); doc.text(l, cx + 3, cy + 5);
        doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(20); doc.text(String(v), cx + 3, cy + 12.5);
      });
      y += Math.ceil(itens.length / cols) * (h + 4) + 4;
    };

    secao("Contas");
    kpis([
      ["Total de contas", c.total], ["Em andamento", c.emAndamento], ["Sem retorno", c.semRetorno],
      ["Contato estabelecido", c.estabelecidos], ["Atendimento programado", c.programado], ["Tarefas atrasadas", c.atrasada],
    ]);

    secao("Funil por etapa");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold"); doc.setTextColor(90);
    doc.text("Etapa", M, y); doc.text("Contas", M + 90, y); doc.text("Conversão p/ próxima", M + 120, y);
    y += 2; doc.line(M, y, W - M, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setTextColor(20);
    c.porEtapa.forEach((e) => {
      doc.text(e.label, M, y); doc.text(String(e.qtd), M + 90, y); doc.text(fmtPct(e.conversao), M + 120, y);
      y += 6;
    });
    y += 4;

    secao("Oportunidades");
    kpis([["Geradas", c.oportunidades], ["Ganhas", c.ganhas], ["Perdidas", c.perdidas], ["Taxa de ganho", fmtPct(c.taxaGanho)]]);

    if (c.temLeads) { secao("Leads"); kpis([["Leads recebidos", c.leads]]); }

    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(110);
    doc.text("Contas criadas no período, pelo responsável atual. Oportunidades pelo corretor da oportunidade. Taxa de ganho = ganhas ÷ (ganhas + perdidas).", M, y, { maxWidth: W - 2 * M });
  });

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(130);
    doc.text(`HR Imóveis · Performance · Página ${i} de ${n}`, W / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
  }
  const nome = corretores.length === 1 ? corretores[0].nome.toLowerCase().replace(/\s+/g, "-") : "todos";
  doc.save(`performance-${nome}-${periodo.replace(/\//g, "-")}.pdf`);
}
