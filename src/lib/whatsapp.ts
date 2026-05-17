export const WHATSAPP_PHONE = "5566999955881";

export function createWhatsAppUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_PHONE}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

type WhatsAppClickEvent = { preventDefault: () => void };

export function openWhatsApp(event?: WhatsAppClickEvent, message?: string) {
  event?.preventDefault();
  const url = createWhatsAppUrl(message);
  const popup = window.open(url, "_blank", "noopener,noreferrer");

  if (!popup) {
    window.location.href = url;
  }
}
