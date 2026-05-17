export type EtapaFunil =
  | "a_contatar"
  | "contatado"
  | "sem_retorno"
  | "reuniao"
  | "visita"
  | "proposta"
  | "fechado"
  | "perdido";

export const ETAPAS: { id: EtapaFunil; label: string; color: string }[] = [
  { id: "a_contatar", label: "A contatar", color: "bg-slate-500/15 text-slate-700 border-slate-500/30" },
  { id: "contatado", label: "Contatado", color: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  { id: "sem_retorno", label: "Sem retorno", color: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  { id: "reuniao", label: "Reunião", color: "bg-violet-500/15 text-violet-700 border-violet-500/30" },
  { id: "visita", label: "Visita", color: "bg-teal-500/15 text-teal-700 border-teal-500/30" },
  { id: "proposta", label: "Proposta", color: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
  { id: "fechado", label: "Fechado", color: "bg-success/15 text-success border-success/30" },
  { id: "perdido", label: "Perdido", color: "bg-destructive/15 text-destructive border-destructive/30" },
];

export const etapaLabel = (id: string) => ETAPAS.find((e) => e.id === id)?.label ?? "A contatar";
export const etapaColor = (id: string) => ETAPAS.find((e) => e.id === id)?.color ?? ETAPAS[0].color;
