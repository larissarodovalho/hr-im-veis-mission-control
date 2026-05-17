export const WHATSAPP_PHONE = "5566999955881";

export function createWhatsAppUrl(message?: string) {
  const params = new URLSearchParams({ phone: WHATSAPP_PHONE });

  if (message) {
    params.set("text", message);
  }

  return `https://api.whatsapp.com/send/?${params.toString()}&type=phone_number&app_absent=0`;
}

export function openWhatsApp(event: React.MouseEvent<HTMLAnchorElement>, message?: string) {
  event.preventDefault();
  const url = createWhatsAppUrl(message);
  window.open(url, "_blank", "noopener,noreferrer");
}
