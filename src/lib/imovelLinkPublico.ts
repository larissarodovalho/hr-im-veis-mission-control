// Cliente do endpoint público dos links temporários de imóveis.
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/imovel-link-publico`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface LinkItemPublico {
  item_id: string;
  titulo: string | null;
  tipo: string | null;
  finalidade: string | null;
  valor: number | null;
  valor_condominio: number | null;
  valor_iptu: number | null;
  localizacao: string | null;
  area_util: number | null;
  area_total: number | null;
  area_construida: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  caracteristicas: string[];
  descricao: string | null;
  video_url: string | null;
  condicoes_comerciais: string | null;
  fotos: string[];
}

export interface LinkPublicoResponse {
  status: "ativo" | "expirado" | "revogado" | "invalido" | "indisponivel";
  tipo?: string;
  codigo_referencia?: string;
  titulo?: string | null;
  mensagem?: string | null;
  expira_em?: string | null;
  configuracao_publica?: Record<string, unknown>;
  corretor?: { nome: string | null; telefone: string | null } | null;
  itens?: LinkItemPublico[];
}

/** Identificador anônimo estável por navegador (não contém dados pessoais). */
function visitorId() {
  const KEY = "hr_link_visitor";
  let v = localStorage.getItem(KEY);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(KEY, v);
  }
  return v;
}
function sessionId() {
  const KEY = "hr_link_session";
  let v = sessionStorage.getItem(KEY);
  if (!v) {
    v = crypto.randomUUID();
    sessionStorage.setItem(KEY, v);
  }
  return v;
}

async function post(body: Record<string, unknown>) {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ ...body, visitor_id: visitorId(), session_id: sessionId() }),
  });
  return res.json();
}

export async function abrirLink(token: string): Promise<LinkPublicoResponse> {
  try {
    return await post({ token, action: "open" });
  } catch {
    return { status: "invalido" };
  }
}

export async function registrarEventoLink(
  token: string,
  tipo_evento: string,
  extras: { item_id?: string; metadata?: Record<string, unknown> } = {},
) {
  try {
    await post({ token, action: "event", tipo_evento, ...extras });
  } catch {
    /* silencioso — métrica não pode quebrar a experiência */
  }
}
