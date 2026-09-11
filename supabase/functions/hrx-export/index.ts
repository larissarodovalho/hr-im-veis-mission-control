import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ENTITIES: Record<string, string> = {
  agents: "profiles",
  leads: "leads",
  accounts: "contas",
  opportunities: "oportunidades",
  proposals: "oportunidade_propostas",
  visits: "oportunidade_visitas",
  sales: "conta_fechamentos",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "x-content-type-options": "nosniff" },
  });

function timingSafeEqual(a: string, b: string) {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

const CURSOR_RE = /^(.+)\|([0-9a-fA-F-]{36})$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const secret = Deno.env.get("HRX_EXPORT_KEY");
  if (!secret) return json({ error: "Export not configured" }, 500);

  const provided = req.headers.get("x-hrx-key") ?? "";
  if (!provided || !timingSafeEqual(provided, secret)) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const url = new URL(req.url);
    let params: Record<string, unknown> = Object.fromEntries(url.searchParams.entries());
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      params = { ...params, ...(body && typeof body === "object" ? body : {}) };
    }

    const entity = String(params.entity ?? "");
    const table = ENTITIES[entity];
    if (!table) {
      return json({ error: `Invalid entity. Use one of: ${Object.keys(ENTITIES).join(", ")}` }, 400);
    }

    let limit = 100;
    if (params.limit != null && params.limit !== "") {
      const n = Number(params.limit);
      if (!Number.isInteger(n) || n < 1 || n > 500) {
        return json({ error: "Invalid limit (integer between 1 and 500)" }, 400);
      }
      limit = n;
    }

    let since: string | null = null;
    if (params.since != null && params.since !== "") {
      const d = new Date(String(params.since));
      if (Number.isNaN(d.getTime())) return json({ error: "Invalid since (ISO date expected)" }, 400);
      since = d.toISOString();
    }

    let cursorTs: string | null = null;
    let cursorId: string | null = null;
    if (params.cursor != null && params.cursor !== "") {
      const m = CURSOR_RE.exec(String(params.cursor));
      if (!m) return json({ error: "Invalid cursor (expected updated_at|id)" }, 400);
      const d = new Date(m[1]);
      if (Number.isNaN(d.getTime())) return json({ error: "Invalid cursor timestamp" }, 400);
      cursorTs = d.toISOString();
      cursorId = m[2];
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    let query = supabase.from(table).select("*");
    if (since) query = query.gte("updated_at", since);
    if (cursorTs && cursorId) {
      query = query.or(
        `updated_at.gt.${cursorTs},and(updated_at.eq.${cursorTs},id.gt.${cursorId})`,
      );
    }
    query = query.order("updated_at", { ascending: true }).order("id", { ascending: true }).limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error("hrx-export query error:", error.message);
      return json({ error: "Query failed" }, 500);
    }

    const items = data ?? [];
    const last = items.length === limit ? (items[items.length - 1] as Record<string, unknown>) : null;
    const next_cursor = last ? `${new Date(String(last.updated_at)).toISOString()}|${last.id}` : null;

    return json({ items, next_cursor });
  } catch (e) {
    console.error("hrx-export error:", e instanceof Error ? e.message : String(e));
    return json({ error: "Internal error" }, 500);
  }
});
