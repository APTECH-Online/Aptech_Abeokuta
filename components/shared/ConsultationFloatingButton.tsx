'use client'

import Link from 'next/link'
import { ArrowRight, CalendarCheck } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { trackConversionEvent } from '../../lib/conversion-events'

// Pages where the button would be redundant or would sit on top of the booking flow itself.
const HIDDEN_ON = ['/book-consultation', '/manage-booking']
const FIELD_SELECTOR = 'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]'

/**
 * Red "Book a Consultation" button. Rendered inside <div class="floating-stack">
 * (see app/(site)/layout.tsx) directly above the Tech IQ button; it has no
 * positioning of its own, so it can never overlap Tech IQ.
 */
export default function ConsultationFloatingButton() {
  const pathname = usePathname()
  const [typing, setTyping] = useState(false)
  const [compact, setCompact] = useState(false)

  // Same 220px scroll threshold as the Tech IQ button, so the pair collapses together.
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 220)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Element | null
      setTyping(Boolean(target?.matches?.(FIELD_SELECTOR)))
    }
    const onFocusOut = () => setTyping(false)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  if (HIDDEN_ON.some((path) => pathname === path || pathname?.startsWith(`${path}/`))) return null

  return (
    <Link
      href="/book-consultation"
      aria-label="Book a Consultation: free admissions counselling"
      className={`consultation-float${compact ? ' is-compact' : ''}${typing ? ' is-suppressed' : ''}`}
      tabIndex={typing ? -1 : undefined}
      aria-hidden={typing ? true : undefined}
      onClick={() => trackConversionEvent('enquiry_cta_clicked', { source: 'floating_consultation_button', destination: '/book-consultation' })}
    >
      <span className="consultation-float__icon" aria-hidden="true">
        <CalendarCheck size={19} strokeWidth={1.9} />
      </span>
      <span className="consultation-float__copy">
        <span className="consultation-float__label">Book a Consultation</span>
        <span className="consultation-float__hint">Free admissions counselling</span>
      </span>
      <ArrowRight className="consultation-float__arrow" size={14} aria-hidden="true" />
    </Link>
  )
}
