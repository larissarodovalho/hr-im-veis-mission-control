export const WHATSAPP_PHONE = "5566999955881";

export function createWhatsAppUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_PHONE}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

type WhatsAppClickEvent = { preventDefault: () => void };

function isInsideFrame() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function openWhatsApp(event?: WhatsAppClickEvent, message?: string) {
  event?.preventDefault();
  const url = createWhatsAppUrl(message);

  if (isInsideFrame()) {
    const topNavigation = window.open(url, "_top");

    if (!topNavigation) {
      try {
        window.top?.location.assign(url);
      } catch {
        window.location.assign(url);
      }
    }

    return;
  }

  const popup = window.open(url, "_blank", "noopener,noreferrer");

  if (!popup) {
    window.location.assign(url);
  }
}
