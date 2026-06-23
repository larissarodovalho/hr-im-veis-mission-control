export const WHATSAPP_PHONE = "5566999515883";

export function createWhatsAppUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_PHONE}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

// Mantido por compatibilidade — não faz nada.
// O <a target="_blank" href={createWhatsAppUrl(...)}> já abre nativamente,
// sem ser bloqueado por pop-up blocker.
export function openWhatsApp(_event?: unknown, _message?: string) {
  return;
}
