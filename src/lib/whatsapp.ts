export const WHATSAPP_PHONE = "5566999955881";

export function createWhatsAppUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_PHONE}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
