// Helpers compartilhados das edge functions do Google Calendar
import { createClient } from "npm:@supabase/supabase-js@2";

export const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

export const TIMEZONE = "America/Cuiaba";

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function userClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

export function redirectUri(req: Request) {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-oauth-callback`;
}

const GOOGLE_CLIENT_ID_RE = /[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com/;

function secretVariants(raw: string) {
  const trimmed = raw.trim();
  const variants = new Set([trimmed]);

  try { variants.add(decodeURIComponent(trimmed)); } catch { /* ignore malformed URI encoding */ }
  try { variants.add(atob(trimmed)); } catch { /* ignore non-base64 secrets */ }
  try { variants.add(JSON.parse(trimmed)); } catch { /* ignore non-JSON string wrapper */ }

  return [...variants].filter((value): value is string => typeof value === "string" && value.length > 0);
}

function extractGoogleClientId(raw: string) {
  for (const variant of secretVariants(raw)) {
    const directMatch = variant.match(GOOGLE_CLIENT_ID_RE);
    if (directMatch) return directMatch[0];

    try {
      const parsed = JSON.parse(variant);
      if (typeof parsed === "string") return extractGoogleClientId(parsed.trim());
      const candidate = parsed?.web?.client_id ?? parsed?.installed?.client_id ?? parsed?.client_id ?? parsed?.clientId;
      if (typeof candidate === "string") return extractGoogleClientId(candidate) || candidate.trim();
    } catch {
      // Secret variant is not JSON.
    }
  }

  return "";
}

function extractGoogleClientSecret(raw: string) {
  for (const variant of secretVariants(raw)) {
    try {
      const parsed = JSON.parse(variant);
      if (typeof parsed === "string") return extractGoogleClientSecret(parsed.trim());
      const candidate = parsed?.web?.client_secret ?? parsed?.installed?.client_secret ?? parsed?.client_secret ?? parsed?.clientSecret;
      if (typeof candidate === "string") return candidate.trim();
    } catch {
      // Secret variant is not JSON.
    }

    if (!variant.match(GOOGLE_CLIENT_ID_RE)) return variant.trim();
  }

  return "";
}

export function googleOAuthClientId() {
  const idRaw = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")?.trim() ?? "";
  const secretRaw = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")?.trim() ?? "";
  return extractGoogleClientId(idRaw) || extractGoogleClientId(secretRaw) || idRaw;
}

export function googleOAuthClientSecret() {
  const secretRaw = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")?.trim() ?? "";
  const idRaw = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")?.trim() ?? "";
  return extractGoogleClientSecret(secretRaw) || extractGoogleClientSecret(idRaw);
}

export async function refreshAccessToken(refresh_token: string) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleOAuthClientId(),
      client_secret: googleOAuthClientSecret(),
      refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error(`refresh failed: ${r.status} ${await r.text()}`);
  return await r.json() as { access_token: string; expires_in: number };
}

export async function getValidAccessToken(supabase: ReturnType<typeof adminClient>, user_id: string) {
  const { data, error } = await supabase
    .from("user_google_calendar")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const expires = new Date(data.token_expires_at).getTime();
  if (expires - Date.now() > 60_000) return data;

  const fresh = await refreshAccessToken(data.refresh_token);
  const newExpiry = new Date(Date.now() + fresh.expires_in * 1000).toISOString();
  await supabase.from("user_google_calendar")
    .update({ access_token: fresh.access_token, token_expires_at: newExpiry })
    .eq("user_id", user_id);
  return { ...data, access_token: fresh.access_token, token_expires_at: newExpiry };
}

export async function gcalFetch(token: string, path: string, init: RequestInit = {}) {
  const r = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return r;
}

function getGoogleErrorMessage(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: unknown } }).error;
    if (typeof error?.message === "string") return error.message;
  }
  if (typeof payload === "string") return payload;
  return JSON.stringify(payload);
}

export function formatGoogleCalendarApiError(status: number, payload: unknown) {
  const raw = getGoogleErrorMessage(payload);
  const serialized = typeof payload === "string" ? payload : JSON.stringify(payload);
  const activationUrl = serialized.match(/https:\/\/console\.developers\.google\.com\/apis\/api\/calendar-json\.googleapis\.com\/overview\?project=[^"\\\s]+/)?.[0];

  if (
    status === 403 &&
    (serialized.includes("SERVICE_DISABLED") || serialized.includes("accessNotConfigured") || serialized.includes("calendar-json.googleapis.com"))
  ) {
    return `A Google Calendar API ainda não está ativada no projeto do OAuth.${activationUrl ? ` Ative em: ${activationUrl}` : ""} Depois, aguarde alguns minutos e sincronize novamente.`;
  }

  return `Google Calendar retornou erro ${status}: ${raw.slice(0, 500)}`;
}
