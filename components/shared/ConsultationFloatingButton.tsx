'use client'

import Link from 'next/link'
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
      className={`consultation-float${typing ? ' is-suppressed' : ''}`}
      tabIndex={typing ? -1 : undefined}
      aria-hidden={typing ? true : undefined}
      onClick={() => trackConversionEvent('enquiry_cta_clicked', { source: 'floating_consultation_button', destination: '/book-consultation' })}
    >
      Book a Consultation
    </Link>
  )
}
