import { supabase } from "@/integrations/supabase/client";

export const onlyDigits = (s?: string | null) => (s || "").replace(/\D/g, "");
export const normEmail = (s?: string | null) => (s || "").trim().toLowerCase();

export type DuplicateMatch = {
  table: "leads" | "contas";
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  documento?: string | null;
  matchedBy: ("email" | "telefone" | "documento")[];
};

/**
 * Procura duplicidades em leads e contas com base em e-mail, telefone (últimos 8 dígitos)
 * e documento (CPF/CNPJ). Retorna os registros encontrados.
 */
export async function findDuplicates(input: {
  email?: string | null;
  telefone?: string | null;
  documento?: string | null;
}): Promise<DuplicateMatch[]> {
  const email = normEmail(input.email);
  const telDigits = onlyDigits(input.telefone);
  const docDigits = onlyDigits(input.documento);
  const telTail = telDigits.length >= 8 ? telDigits.slice(-8) : "";

  const matches = new Map<string, DuplicateMatch>();
  const add = (
    table: "leads" | "contas",
    row: any,
    by: "email" | "telefone" | "documento"
  ) => {
    const key = `${table}:${row.id}`;
    const existing = matches.get(key);
    if (existing) {
      if (!existing.matchedBy.includes(by)) existing.matchedBy.push(by);
    } else {
      matches.set(key, {
        table,
        id: row.id,
        nome: row.nome,
        email: row.email ?? null,
        telefone: row.telefone ?? null,
        documento: row.documento ?? null,
        matchedBy: [by],
      });
    }
  };

  // Leads
  if (email) {
    const { data } = await supabase.from("leads").select("id,nome,email,telefone").ilike("email", email).limit(5);
    (data ?? []).forEach((r) => add("leads", r, "email"));
  }
  if (telTail) {
    const { data } = await supabase.from("leads").select("id,nome,email,telefone").ilike("telefone", `%${telTail}%`).limit(10);
    (data ?? []).forEach((r) => {
      if (onlyDigits(r.telefone).slice(-8) === telTail) add("leads", r, "telefone");
    });
  }

  // Contas
  if (email) {
    const { data } = await supabase.from("contas").select("id,nome,email,telefone,documento").ilike("email", email).limit(5);
    (data ?? []).forEach((r) => add("contas", r, "email"));
  }
  if (telTail) {
    const { data } = await supabase.from("contas").select("id,nome,email,telefone,documento").ilike("telefone", `%${telTail}%`).limit(10);
    (data ?? []).forEach((r) => {
      if (onlyDigits(r.telefone).slice(-8) === telTail) add("contas", r, "telefone");
    });
  }
  if (docDigits) {
    const { data } = await supabase.from("contas").select("id,nome,email,telefone,documento").ilike("documento", `%${docDigits}%`).limit(10);
    (data ?? []).forEach((r) => {
      if (onlyDigits(r.documento).includes(docDigits)) add("contas", r, "documento");
    });
  }

  return Array.from(matches.values());
}

export function describeMatch(m: DuplicateMatch): string {
  const where = m.table === "leads" ? "Lead" : "Conta";
  const by = m.matchedBy
    .map((b) => (b === "email" ? "e-mail" : b === "telefone" ? "telefone" : "documento"))
    .join(" e ");
  return `${where} já cadastrado(a) (${by}): ${m.nome}`;
}
