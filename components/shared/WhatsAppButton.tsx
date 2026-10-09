'use client'

import { MessageCircle } from 'lucide-react'
import type { MouseEvent } from 'react'
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE } from '../../lib/whatsapp'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost'
}

export default function WhatsAppButton({
  whatsapp,
  message = WHATSAPP_DEFAULT_MESSAGE,
  label = 'Chat with Admissions',
  variant = 'secondary',
  className = '',
  showIcon = true,
  contextLabel,
  inquiryReference,
  contextType = 'page'
}: {
  whatsapp: string
  message?: string
  label?: string
  variant?: Variant
  className?: string
  showIcon?: boolean
  contextLabel?: string
  inquiryReference?: string
  contextType?: 'programme' | 'challenge' | 'page' | 'application' | 'fees'
}) {
  const contextualMessage = [message, contextLabel ? `I was viewing: ${contextLabel}.` : '', inquiryReference ? `My inquiry reference is ${inquiryReference}.` : ''].filter(Boolean).join(' ')
  function trackClick(event: MouseEvent<HTMLAnchorElement>) {
    const pagePath = typeof window !== 'undefined' ? window.location.pathname : ''
    const pageTitle = typeof document !== 'undefined' ? document.title : ''
    let sessionId: string | undefined
    try { sessionId = window.sessionStorage.getItem('aptech_analytics_session') || undefined } catch { /* analytics remains best-effort */ }
    const effectiveContext = contextLabel || pageTitle || pagePath || 'APTECH Abeokuta website'
    const finalMessage = [message, contextLabel ? `I was viewing: ${contextLabel}.` : `I was viewing: ${effectiveContext}.`, inquiryReference ? `My inquiry reference is ${inquiryReference}.` : ''].filter(Boolean).join(' ')
    event.preventDefault()
    window.open(buildWhatsAppLink(whatsapp, finalMessage), '_blank', 'noopener,noreferrer')
    void fetch('/api/analytics/events', { method: 'POST', headers: { 'content-type': 'application/json' }, keepalive: true, body: JSON.stringify({ event: 'whatsapp_conversion_clicked', sessionId, metadata: { pagePath: pagePath.slice(0, 300), pageTitle: pageTitle.slice(0, 180), contextLabel: effectiveContext.slice(0, 180), contextType, inquiryReference: inquiryReference?.slice(0, 80) || null } }) }).catch(() => {})
  }
  return (
    <a
      href={buildWhatsAppLink(whatsapp, contextualMessage)}
      onClick={trackClick}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`${VARIANT_CLASS[variant]} inline-flex items-center justify-center gap-2 ${className}`}
    >
      {showIcon && <MessageCircle size={16} aria-hidden="true" />}
      {label}
    </a>
  )
}
