// Fuso horário oficial do CRM — HR Imóveis opera em Cuiabá/Sinop (MT, UTC-4).
// Todas as exibições e agrupamentos de data do sistema usam este fuso,
// independente do relógio do dispositivo de quem acessa.
export const CRM_TZ = "America/Cuiaba";

type DateLike = Date | string | number | null | undefined;

function toDate(d: DateLike): Date | null {
  if (d === null || d === undefined || d === "") return null;
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

const partsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: CRM_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

type WallParts = { y: number; m: number; d: number; hh: number; mm: number; ss: number };

function wallParts(dt: Date): WallParts {
  const map: Record<string, string> = {};
  for (const p of partsFmt.formatToParts(dt)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  // alguns ambientes retornam "24" para meia-noite com hourCycle h23
  const hh = map.hour === "24" ? 0 : Number(map.hour);
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
    hh,
    mm: Number(map.minute),
    ss: Number(map.second),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "30/07/2026" (Cuiabá) */
export function fmtDate(d: DateLike): string {
  const dt = toDate(d);
  if (!dt) return "—";
  const p = wallParts(dt);
  return `${pad(p.d)}/${pad(p.m)}/${p.y}`;
}

/** "15:35" (Cuiabá) */
export function fmtTime(d: DateLike): string {
  const dt = toDate(d);
  if (!dt) return "—";
  const p = wallParts(dt);
  return `${pad(p.hh)}:${pad(p.mm)}`;
}

/** "30/07/2026 às 15:35" (Cuiabá) */
export function fmtDateTime(d: DateLike): string {
  const dt = toDate(d);
  if (!dt) return "—";
  return `${fmtDate(dt)} às ${fmtTime(dt)}`;
}

/** "30 jul 2026 às 15:35" (Cuiabá) — estilo de timeline */
export function fmtDateTimeLong(d: DateLike): string {
  const dt = toDate(d);
  if (!dt) return "—";
  const p = wallParts(dt);
  return `${pad(p.d)} ${MESES[p.m - 1]} ${p.y} às ${pad(p.hh)}:${pad(p.mm)}`;
}

/** "30/07 às 15:35" (Cuiabá) — prazos de tentativa */
export function fmtDayMonthTime(d: DateLike): string {
  const dt = toDate(d);
  if (!dt) return "—";
  const p = wallParts(dt);
  return `${pad(p.d)}/${pad(p.m)} às ${pad(p.hh)}:${pad(p.mm)}`;
}

/** "2026-07-30" — chave de dia em Cuiabá (agrupamentos e comparações) */
export function dayKeyCRM(d: DateLike): string {
  const dt = toDate(d);
  if (!dt) return "";
  const p = wallParts(dt);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

/** Dia de hoje em Cuiabá: "2026-07-30" */
export function todayCRM(): string {
  return dayKeyCRM(new Date());
}

/** Valor para <input type="datetime-local"> exibindo o instante no relógio de Cuiabá */
export function toCuiabaInputValue(d: DateLike): string {
  const dt = toDate(d);
  if (!dt) return "";
  const p = wallParts(dt);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.hh)}:${pad(p.mm)}`;
}

function offsetMsAt(utcMs: number): number {
  const p = wallParts(new Date(utcMs));
  const wall = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  return wall - utcMs;
}

/** Converte "2026-07-30T15:35" (relógio de Cuiabá) para ISO UTC */
export function fromCuiabaInputValue(v: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(v ?? "");
  if (!m) return null;
  const wall = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  let utc = wall - offsetMsAt(wall);
  utc = wall - offsetMsAt(utc); // segunda passagem para precisão na virada de offset
  const dt = new Date(utc);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}
