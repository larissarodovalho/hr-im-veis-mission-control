export type Temperatura = "quente" | "morno" | "frio";

export const TEMPERATURAS: { id: Temperatura; label: string; emoji: string; badge: string }[] = [
  { id: "quente", label: "Quente", emoji: "🔥", badge: "bg-red-500/15 text-red-700 border-red-500/30" },
  { id: "morno", label: "Morno", emoji: "🌤️", badge: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  { id: "frio", label: "Frio", emoji: "❄️", badge: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
];

export const tempInfo = (id?: string | null) =>
  TEMPERATURAS.find((t) => t.id === id) ?? null;
