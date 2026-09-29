import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fromCuiabaInputValue } from "@/lib/datetime";

type PeriodCtx = {
  ano: number;
  mes: number | null; // 1-12, or null = ano inteiro
  setAno: (a: number) => void;
  setMes: (m: number | null) => void;
  /** yyyy-MM-dd */
  inicio: string;
  /** yyyy-MM-dd */
  fim: string;
  /** ISO datetime (start of day) */
  inicioISO: string;
  /** ISO datetime (end of day) */
  fimISO: string;
  /** Rótulo curto do período. Ex: "2026" ou "Mar/2026" */
  label: string;
  anos: number[];
  /** Incrementa quando dados do sistema mudam (realtime) */
  refreshKey: number;
};

const Ctx = createContext<PeriodCtx | null>(null);

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const MESES_LABELS = MESES;

const REPORT_TABLES = [
  "contas", "tarefas", "interacoes", "oportunidades", "leads", "conta_propostas", "conta_fechamentos",
  "vendas", "oportunidade_visitas", "oportunidade_propostas", "captacoes_imovel", "propostas", "imoveis",
  "carteira_atribuicoes", "carteira_lotes", "imovel_link_eventos", "imovel_links_compartilhados", "metas_vgv", "metas_institucionais", "metas_vgv_ano", "metas_vgv_vagas",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month1: number) {
  return new Date(year, month1, 0).getDate();
}

export function ReportsPeriodProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Canal único: qualquer mudança nas tabelas de origem recarrega os relatórios
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const bump = () => { clearTimeout(t); t = setTimeout(() => setRefreshKey((k) => k + 1), 3000); };
    const ch = supabase.channel("reports-sync");
    REPORT_TABLES.forEach((table) => ch.on("postgres_changes" as any, { event: "*", schema: "public", table }, bump));
    ch.subscribe();
    return () => { clearTimeout(t); supabase.removeChannel(ch); };
  }, []);

  const value = useMemo<PeriodCtx>(() => {
    let inicio: string;
    let fim: string;
    let label: string;
    if (mes == null) {
      inicio = `${ano}-01-01`;
      fim = `${ano}-12-31`;
      label = `${ano}`;
    } else {
      inicio = `${ano}-${pad(mes)}-01`;
      fim = `${ano}-${pad(mes)}-${pad(daysInMonth(ano, mes))}`;
      label = `${MESES[mes - 1].slice(0, 3)}/${ano}`;
    }
    const anos: number[] = [];
    const currentYear = now.getFullYear();
    for (let y = currentYear - 4; y <= currentYear + 1; y++) anos.push(y);
    if (!anos.includes(ano)) anos.push(ano);
    anos.sort((a, b) => b - a);

    return {
      ano,
      mes,
      setAno,
      setMes,
      inicio,
      fim,
      inicioISO: fromCuiabaInputValue(`${inicio}T00:00`) ?? `${inicio}T04:00:00.000Z`,
      fimISO: fromCuiabaInputValue(`${fim}T23:59`)?.replace(":00.000Z", ":59.999Z") ?? `${fim}T03:59:59.999Z`,
      label,
      anos,
      refreshKey,
    };
  }, [ano, mes, refreshKey]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReportsPeriod() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useReportsPeriod fora do ReportsPeriodProvider");
  return v;
}
