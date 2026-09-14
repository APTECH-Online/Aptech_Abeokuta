import Link from 'next/link'
import { GraduationCap, MessageCircle } from 'lucide-react'
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE } from '../../lib/whatsapp'

/**
 * Discreet, mobile-only sticky action bar. Hidden on md and up, where the
 * header CTAs already cover this. Uses safe-area padding so it clears the
 * home indicator on iOS, and sits below any content via a body-level spacer
 * added in SiteLayout so it never overlaps the footer or a form's submit
 * button.
 */
export default function StickyMobileCTA({ whatsapp }: { whatsapp: string }) {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-2"
      style={{
        borderTop: '1px solid var(--color-line)',
        background: 'var(--color-paper-alt)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -8px 24px rgba(19,12,46,0.08)'
      }}
    >
      <a
        href={buildWhatsAppLink(whatsapp, WHATSAPP_DEFAULT_MESSAGE)}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="flex items-center justify-center gap-1.5 py-3 text-sm font-semibold"
        style={{ color: 'var(--color-teal-700)', borderRight: '1px solid var(--color-line)' }}
      >
        <MessageCircle size={16} aria-hidden="true" />
        WhatsApp Admissions
      </a>
      <Link
        href="/admissions"
        className="flex items-center justify-center gap-1.5 py-3 text-sm font-semibold"
        style={{ color: 'var(--color-navy-900)', background: 'var(--color-amber-100)' }}
      >
        <GraduationCap size={16} aria-hidden="true" />
        Apply Now
      </Link>
    </div>
  )
}
