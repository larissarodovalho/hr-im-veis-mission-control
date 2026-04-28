// Cliente compartilhado da Clicksign API v1
// Docs: https://developers.clicksign.com/

export function getClicksignConfig() {
  const rawToken = Deno.env.get("CLICKSIGN_API_TOKEN")?.trim();
  const env = normalizeClicksignEnv(Deno.env.get("CLICKSIGN_ENV"));
  const token = normalizeClicksignToken(rawToken);
  if (!token) throw new Error("CLICKSIGN_API_TOKEN não configurado");
  const baseUrl = env === "production"
    ? "https://app.clicksign.com/api/v1"
    : "https://sandbox.clicksign.com/api/v1";
  return { token, baseUrl, env };
}

function normalizeClicksignEnv(value?: string | null) {
  const env = (value || "sandbox").trim().toLowerCase();
  if (["production", "producao", "produção", "prod"].includes(env)) return "production";
  return "sandbox";
}

function normalizeClicksignToken(value?: string) {
  if (!value) return "";
  let token = value.trim().replace(/^Bearer\s+/i, "");
  const queryToken = token.match(/[?&]access_token=([^&\s]+)/i)?.[1];
  if (queryToken) token = queryToken;
  token = token
    .replace(/^access_token\s*[:=]\s*/i, "")
    .replace(/^token\s*[:=]\s*/i, "")
    .replace(/^api[_ -]?token\s*[:=]\s*/i, "")
    .replace(/^['"`]|['"`]$/g, "")
    .replace(/\s+/g, "")
    .trim();
  try { return decodeURIComponent(token).trim(); } catch { return token; }
}

function getClicksignSafeDiagnostics(token: string, baseUrl: string, env: string) {
  const host = new URL(baseUrl).host;
  return {
    env,
    host,
    tokenLength: token.length,
    tokenPreview: token.length > 8 ? `${token.slice(0, 4)}…${token.slice(-4)}` : "curto-demais",
  };
}

export async function clicksignFetch(path: string, init: RequestInit = {}) {
  const { token, baseUrl, env } = getClicksignConfig();
  const sep = path.includes("?") ? "&" : "?";
  const url = `${baseUrl}${path}${sep}access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = typeof data === "object" ? JSON.stringify(data) : String(data);
    if (res.status === 403 && msg.includes("Access Token inválido")) {
      console.error("Clicksign token rejected", getClicksignSafeDiagnostics(token, baseUrl, env));
      throw new Error(`Clicksign recusou o token. Ambiente atual: ${env} (${new URL(baseUrl).host}). O token salvo tem ${token.length} caracteres após limpeza; confirme se é o token API desse mesmo ambiente.`);
    }
    throw new Error(`Clicksign ${res.status}: ${msg}`);
  }
  return data;
}

// Validação HMAC-SHA256 de webhook (header: Content-Hmac: sha256=...)
export async function verifyClicksignHmac(rawBody: string, headerValue: string | null): Promise<boolean> {
  const secret = Deno.env.get("CLICKSIGN_HMAC_SECRET");
  if (!secret || !headerValue) return false;
  const provided = headerValue.replace(/^sha256=/, "").trim().toLowerCase();
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
