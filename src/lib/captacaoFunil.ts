export type EstagioCaptacao =
  | "novo"
  | "agendar"
  | "detalhamento"
  | "agendada"
  | "cadastro"
  | "concluido";

export const ESTAGIOS_CAPTACAO: { id: EstagioCaptacao; label: string; color: string }[] = [
  { id: "novo", label: "Novo (recebido)", color: "bg-slate-500/10 border-slate-500/30" },
  { id: "agendar", label: "Agendar captação", color: "bg-blue-500/10 border-blue-500/30" },
  { id: "detalhamento", label: "Enviar detalhamento 24 horas antes", color: "bg-amber-500/10 border-amber-500/30" },
  { id: "agendada", label: "Captação agendada", color: "bg-indigo-500/10 border-indigo-500/30" },
  { id: "cadastro", label: "Cadastro do imóvel", color: "bg-violet-500/10 border-violet-500/30" },
  { id: "concluido", label: "Concluído", color: "bg-emerald-500/10 border-emerald-500/30" },
];

export const estagioCaptacaoLabel = (id: string) =>
  ESTAGIOS_CAPTACAO.find((e) => e.id === id)?.label ?? "Novo";
