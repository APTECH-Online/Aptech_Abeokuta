import { siteConfig } from '../data/site'

/**
 * Builds a wa.me deep link using the centre's verified WhatsApp number from
 * data/site.ts. Never hardcode a phone number at the call site — always go
 * through this so every WhatsApp CTA on the site points at the same,
 * verified number.
 */
export function buildWhatsAppLink(message?: string) {
  const digits = siteConfig.whatsapp.replace(/[^\d]/g, '')
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hi APTECH Abeokuta, I'd like to speak with Admissions about your programmes."
