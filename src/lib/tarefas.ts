import { dayKeyCRM, todayCRM } from "@/lib/datetime";

export type NextTaskResumo = { titulo: string; prazo: string; prioridade: string };

/**
 * Countdown da próxima tarefa pendente, em dias (fuso America/Cuiaba).
 * futuro: "em X dias" | hoje: "contatar hoje/amanhã" | atrasada: "atrasada há X dias"
 */
export function nextTaskCountdown(prazo: string): { texto: string; tom: "futuro" | "hoje" | "atrasada" } | null {
  const hoje = todayCRM();
  const dia = dayKeyCRM(prazo);
  if (!dia) return null;
  const diff = Math.round((new Date(dia + "T12:00:00").getTime() - new Date(hoje + "T12:00:00").getTime()) / 86400000);
  if (diff < 0) return { texto: `atrasada há ${-diff} dia${-diff > 1 ? "s" : ""}`, tom: "atrasada" };
  if (diff === 0) return { texto: "contatar hoje", tom: "hoje" };
  if (diff === 1) return { texto: "contatar amanhã", tom: "hoje" };
  return { texto: `em ${diff} dias`, tom: "futuro" };
}
