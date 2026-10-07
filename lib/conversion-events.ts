'use client'

let sessionId: string | null = null
function getSessionId() {
  if (sessionId) return sessionId
  try {
    const key = 'aptech-analytics-session'
    sessionId = sessionStorage.getItem(key)
    if (!sessionId) { sessionId = crypto.randomUUID(); sessionStorage.setItem(key, sessionId) }
  } catch { sessionId = null }
  return sessionId
}

export function trackConversionEvent(event: string, metadata?: Record<string, unknown>, leadId?: string) {
  void fetch('/api/analytics/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event, metadata: metadata ?? {}, leadId: leadId ?? null, sessionId: getSessionId() }), keepalive: true }).catch(() => undefined)
}
