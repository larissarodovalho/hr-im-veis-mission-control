export const WHATSAPP_PHONE = "5566999515883";

export function createWhatsAppUrl(message?: string) {
  const base = `https://wa.me/${WHATSAPP_PHONE}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

type WhatsAppClickEvent = {
  preventDefault: () => void;
  defaultPrevented?: boolean;
};

export function openWhatsApp(event?: WhatsAppClickEvent, message?: string) {
  // Deixa o comportamento nativo do <a target="_blank"> abrir a nova aba.
  // Só intervém se, por algum motivo, o navegador não tiver aberto nada.
  if (event?.defaultPrevented) return;

  const url = createWhatsAppUrl(message);

  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win) {
      event?.preventDefault();
    }
  } catch {
    // ignora — o link nativo cuidará da navegação
  }
}
