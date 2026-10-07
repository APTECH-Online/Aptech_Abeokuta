export type AttributionSnapshot = {
  firstSource: string
  firstMedium: string
  firstCampaign: string
  firstContent: string
  firstTerm: string
  firstCampaignId: string
  lastSource: string
  lastMedium: string
  lastCampaign: string
  lastContent: string
  lastTerm: string
  lastCampaignId: string
  landingPage: string
  referrer: string
  conversionPoint: string
}

const KEY = 'aptech-marketing-attribution-v1'
const MAX = 240

function sourceFrom(source: string, medium: string, referrer: string) {
  const s = source.toLowerCase()
  const m = medium.toLowerCase()
  if (s) return s
  if (/whatsapp/.test(referrer)) return 'whatsapp'
  if (/google\./.test(referrer)) return 'google'
  if (/facebook|instagram/.test(referrer)) return referrer.includes('instagram') ? 'instagram' : 'facebook'
  if (m === 'email') return 'email'
  if (referrer) return 'referral'
  return 'direct'
}

function read(): Partial<AttributionSnapshot> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
function write(v: Partial<AttributionSnapshot>) {
  try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* privacy/storage restrictions */ }
}

export function captureAttribution(search = window.location.search) {
  const params = new URLSearchParams(search)
  const previous = read()
  const referrer = document.referrer || previous.referrer || ''
  const utmSource = params.get('utm_source') || ''
  const utmMedium = params.get('utm_medium') || ''
  const utmCampaign = params.get('utm_campaign') || ''
  const utmContent = params.get('utm_content') || ''
  const utmTerm = params.get('utm_term') || ''
  const campaignId = params.get('campaign_id') || ''
  const meaningful = Boolean(utmSource || utmMedium || utmCampaign || campaignId || referrer)
  const source = sourceFrom(utmSource, utmMedium, referrer)
  const current = {
    source, medium: utmMedium || (source === 'direct' ? 'direct' : source === 'google' ? 'organic' : ''), campaign: utmCampaign,
    content: utmContent, term: utmTerm, campaignId, landingPage: window.location.pathname, referrer,
  }
  const next: Partial<AttributionSnapshot> = {
    ...previous,
    lastSource: meaningful ? current.source : previous.lastSource || 'direct',
    lastMedium: meaningful ? current.medium : previous.lastMedium || 'direct',
    lastCampaign: meaningful ? current.campaign : previous.lastCampaign || '',
    lastContent: meaningful ? current.content : previous.lastContent || '',
    lastTerm: meaningful ? current.term : previous.lastTerm || '',
    lastCampaignId: meaningful ? current.campaignId : previous.lastCampaignId || '',
    landingPage: previous.landingPage || current.landingPage,
    referrer: current.referrer,
    conversionPoint: previous.conversionPoint || '',
  }
  if ((!previous.firstSource || previous.firstSource === 'direct') && meaningful && current.source !== 'direct') {
    next.firstSource = current.source
    next.firstMedium = current.medium
    next.firstCampaign = current.campaign
    next.firstContent = current.content
    next.firstTerm = current.term
    next.firstCampaignId = current.campaignId
  }
  if (!next.firstSource) {
    next.firstSource = previous.firstSource || 'direct'
    next.firstMedium = previous.firstMedium || 'direct'
  }
  write(next)
  return next as AttributionSnapshot
}

export function getAttributionSnapshot(): Partial<AttributionSnapshot> { return read() }
export function setConversionPoint(point: string) { const v = read(); write({ ...v, conversionPoint: point.slice(0, MAX) }) }
export function clearAttribution() { try { localStorage.removeItem(KEY) } catch {} }
