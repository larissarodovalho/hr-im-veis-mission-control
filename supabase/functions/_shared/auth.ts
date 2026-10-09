// Helpers de autenticação/autorização para edge functions.
import { createClient } from "npm:@supabase/supabase-js@2";

export type Caller =
  | { kind: "service" }
  | { kind: "user"; userId: string; authHeader: string };

/** Identifica quem chama: a chave de serviço (cron/servidor) ou um usuário autenticado. */
export async function getCaller(req: Request): Promise<Caller | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && token === serviceKey) return { kind: "service" };
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await client.auth.getClaims(token);
  const sub = data?.claims?.sub as string | undefined;
  if (error || !sub || data?.claims?.role !== "authenticated") return null;
  return { kind: "user", userId: sub, authHeader };
}

export function userScopedClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

export async function userHasRole(userId: string, roles: string[]) {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await admin.from("user_roles").select("role").eq("user_id", userId).in("role", roles);
  return (data ?? []).length > 0;
}

/** Retorna uma Response 401/403 quando o chamador não é admin; null quando autorizado. */
export async function requireAdmin(req: Request, corsHeaders: Record<string, string>): Promise<Response | null> {
  const caller = await getCaller(req);
  const h = { ...corsHeaders, "Content-Type": "application/json" };
  if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: h });
  if (caller.kind === "service") return null;
  if (!(await userHasRole(caller.userId, ["admin"]))) {
    return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), { status: 403, headers: h });
  }
  return null;
}
