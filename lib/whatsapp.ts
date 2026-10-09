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

/** Best-effort conversion telemetry. Clicks are intentionally anonymous; the CRM
 * only links outcomes to a lead after an authenticated staff member confirms them. */
export function trackWhatsAppConversion(metadata: {
  contextLabel?: string
  contextType?: 'programme' | 'challenge' | 'page' | 'application' | 'fees'
  inquiryReference?: string
  pagePath?: string
} = {}) {
  if (typeof window === 'undefined') return
  let sessionId: string | undefined
  try { sessionId = window.sessionStorage.getItem('aptech_analytics_session') || undefined } catch { /* optional analytics storage */ }
  void fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      event: 'whatsapp_conversion_clicked',
      sessionId,
      metadata: {
        pagePath: (metadata.pagePath || window.location.pathname).slice(0, 300),
        pageTitle: document.title.slice(0, 180),
        contextLabel: (metadata.contextLabel || document.title || window.location.pathname).slice(0, 180),
        contextType: metadata.contextType || 'page',
        inquiryReference: metadata.inquiryReference?.slice(0, 80) || null
      }
    })
  }).catch(() => {})
}
