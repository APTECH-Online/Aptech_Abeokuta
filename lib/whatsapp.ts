/**
 * Builds a wa.me deep link from a WhatsApp number and optional message.
 * Pure and synchronous by design so it can be called from client
 * components — the number itself is no longer imported from static
 * config; it comes from the CRM (contact_info table, see migration
 * 0012_contact_info.sql / lib/contact-info-public.ts) and is passed in by
 * the caller, usually threaded down from a server component that already
 * fetched it. Never hardcode a phone number at the call site.
 */
export function buildWhatsAppLink(whatsappNumber: string, message?: string) {
  const digits = whatsappNumber.replace(/[^\d]/g, '')
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hi APTECH Abeokuta, I'd like to speak with Admissions about your programmes."
