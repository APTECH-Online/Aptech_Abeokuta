'use client'

import Link from 'next/link'
import { BrainCircuit, Sparkles } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { trackConversionEvent } from '../../lib/conversion-events'

export default function TechIqFloatingButton() {
  const pathname = usePathname()
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 220)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (pathname === '/tech-challenge') return null

  return (
    <Link
      href="/tech-challenge"
      aria-label="Open Tech IQ Challenge"
      className={`tech-iq-float${compact ? ' is-compact' : ''}`}
      onClick={() => trackConversionEvent('tech_iq_floating_button_clicked')}
    >
      <span className="tech-iq-float__icon" aria-hidden="true">
        <BrainCircuit size={19} strokeWidth={1.9} />
      </span>
      <span className="tech-iq-float__copy">
        <span className="tech-iq-float__label">Tech IQ</span>
        <span className="tech-iq-float__hint">Test your tech skills</span>
      </span>
      <Sparkles className="tech-iq-float__spark" size={13} aria-hidden="true" />
    </Link>
  )
}
