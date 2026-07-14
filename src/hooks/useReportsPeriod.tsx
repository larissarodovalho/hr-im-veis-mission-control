import { createContext, useContext, useMemo, useState, ReactNode } from "react";

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
};

const Ctx = createContext<PeriodCtx | null>(null);

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const MESES_LABELS = MESES;

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
      inicioISO: `${inicio}T00:00:00.000`,
      fimISO: `${fim}T23:59:59.999`,
      label,
      anos,
    };
  }, [ano, mes]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReportsPeriod() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useReportsPeriod fora do ReportsPeriodProvider");
  return v;
}
