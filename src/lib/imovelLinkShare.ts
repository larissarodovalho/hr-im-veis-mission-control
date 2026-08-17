// Etapa 9 — utilitários de compartilhamento do link temporário.
import { supabase } from "@/integrations/supabase/client";

export type EventoInterno =
  | "envio_whatsapp_iniciado"
  | "envio_confirmado"
  | "copia_link_interno"
  | "compartilhamento_nativo_interno"
  | "qrcode_gerado"
  | "abrir_nova_aba";

const ultimos = new Map<string, number>();

/** Registra o evento interno de forma idempotente (1 por tipo/link a cada minuto). */
export async function registrarEventoInterno(
  linkId: string,
  tipo: EventoInterno,
  metadata: Record<string, unknown> = {},
) {
  const chave = `${linkId}:${tipo}`;
  const agora = Date.now();
  const anterior = ultimos.get(chave);
  if (anterior && agora - anterior < 60_000) return;
  ultimos.set(chave, agora);
  try {
    await supabase.from("imovel_link_eventos").insert({
      link_id: linkId,
      tipo_evento: tipo,
      metadata: metadata as any,
    } as any);
  } catch {
    /* métrica não bloqueia o fluxo */
  }
}

/** Mensagem padrão: sem nome, telefone, CPF ou ID do cliente. */
export function mensagemWhatsapp(opts: {
  codigo?: string | null;
  titulo: string;
  url: string;
  codigoReferencia: string;
  quantidade?: number;
}) {
  const identificacao =
    opts.quantidade && opts.quantidade > 1
      ? `${opts.quantidade} imóveis selecionados${opts.titulo ? ` — ${opts.titulo}` : ""}`
      : `${opts.codigo ? `${opts.codigo} — ` : ""}${opts.titulo}`;
  return `Olá! Separei este imóvel para você: ${identificacao}. O acesso é temporário: ${opts.url}. Referência: ${opts.codigoReferencia}.`;
}

/** Copia com fallback para navegadores que bloqueiam a área de transferência. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
