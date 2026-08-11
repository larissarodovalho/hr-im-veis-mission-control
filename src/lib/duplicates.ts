import { supabase } from "@/integrations/supabase/client";

export const onlyDigits = (s?: string | null) => (s || "").replace(/\D/g, "");
export const normEmail = (s?: string | null) => (s || "").trim().toLowerCase();
// Nome normalizado para comparar duplicidades: sem acento, minúsculo, espaços simples.
export const normName = (s?: string | null) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export type DuplicateMatch = {
  table: "leads" | "contas";
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  documento?: string | null;
  etapa?: string | null;
  categoria?: string | null;
  responsavel_nome?: string | null;
  matchedBy: ("email" | "telefone" | "documento" | "nome")[];
};

/** Match forte (telefone/e-mail/documento) bloqueia o cadastro; só nome apenas avisa. */
export const isStrongMatch = (m: DuplicateMatch) => m.matchedBy.some((b) => b !== "nome");


/**
 * Procura duplicidades em leads e contas por telefone (normalizado) e e-mail.
 * Usa a função SECURITY DEFINER `check_duplicate_contact` para que corretores
 * também sejam avisados quando o cadastro pertence a outro corretor — a função
 * devolve apenas dados mínimos (nome, etapa, responsável), sem expor telefone
 * ou e-mail dos registros que o corretor não pode ver.
 */
export async function findDuplicates(input: {
  email?: string | null;
  telefone?: string | null;
  documento?: string | null;
}): Promise<DuplicateMatch[]> {
  const email = normEmail(input.email);
  const telDigits = onlyDigits(input.telefone);
  const docDigits = onlyDigits(input.documento);

  const matches = new Map<string, DuplicateMatch>();
  const addOrMerge = (
    key: string,
    base: Omit<DuplicateMatch, "matchedBy">,
    by: DuplicateMatch["matchedBy"][number],
  ) => {
    const existing = matches.get(key);
    if (existing) {
      if (!existing.matchedBy.includes(by)) existing.matchedBy.push(by);
    } else {
      matches.set(key, { ...base, matchedBy: [by] });
    }
  };

  if (email || telDigits) {
    const { data, error } = await supabase.rpc("check_duplicate_contact", {
      _phone: telDigits || "",
      _email: email || "",
    });
    if (!error && data) {
      for (const row of data as any[]) {
        const table: "leads" | "contas" = row.entidade === "lead" ? "leads" : "contas";
        const key = `${table}:${row.id}`;
        const primary: "telefone" | "email" = telDigits ? "telefone" : "email";
        addOrMerge(
          key,
          {
            table,
            id: row.id,
            nome: row.nome,
            email: null,
            telefone: null,
            etapa: row.etapa,
            responsavel_nome: row.responsavel_nome,
          },
          primary,
        );
        if (telDigits && email) addOrMerge(key, matches.get(key)!, "email");
      }
    }
  }

  // Documento — consulta direta (RLS filtra normalmente)
  if (docDigits) {
    const { data } = await supabase
      .from("contas")
      .select("id,nome,email,telefone,documento")
      .ilike("documento", `%${docDigits}%`)
      .limit(10);
    (data ?? []).forEach((r) => {
      if (onlyDigits(r.documento).includes(docDigits)) {
        const key = `contas:${r.id}`;
        addOrMerge(
          key,
          {
            table: "contas",
            id: r.id,
            nome: r.nome,
            email: r.email ?? null,
            telefone: r.telefone ?? null,
            documento: r.documento ?? null,
          },
          "documento",
        );
      }
    });
  }

  return Array.from(matches.values());
}

export function describeMatch(m: DuplicateMatch): string {
  const where = m.table === "leads" ? "Lead" : "Conta";
  const by = m.matchedBy
    .map((b) => (b === "email" ? "e-mail" : b === "telefone" ? "telefone" : b === "documento" ? "documento" : "nome"))
    .join(" e ");
  const resp = m.responsavel_nome ? ` — responsável: ${m.responsavel_nome}` : "";
  return `${where} já cadastrado(a) (${by}): ${m.nome}${resp}`;
}
