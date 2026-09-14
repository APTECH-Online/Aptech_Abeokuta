import { ReactNode } from 'react'
import Header from '../../components/navigation/Header'
import Footer from '../../components/footer/Footer'
import StickyMobileCTA from '../../components/shared/StickyMobileCTA'
import { getPublicContactInfo } from '../../lib/contact-info-public'

/**
 * Layout for the public marketing website only (everything under the
 * (site) route group — home, about, courses, admissions, etc). This is
 * deliberately separate from the CRM at /admin, which has its own layout
 * with no public navigation or footer. See app/admin/layout.tsx.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  // Fetched once here and passed down as a prop, rather than re-fetched
  // inside Header/StickyMobileCTA themselves: both are simple components
  // (Header is a Client Component for its mobile-menu state, so it can't
  // call the server-only fetcher itself) that only need the WhatsApp
  // number, so a plain prop is simpler than a Context provider for one
  // string. See lib/contact-info-public.ts.
  const { whatsapp } = await getPublicContactInfo()

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="min-h-screen flex flex-col">
        <Header whatsapp={whatsapp} />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
        {/* Spacer so the sticky mobile bar never overlaps footer links or a
            form's own submit button on small screens. */}
        <div className="md:hidden" style={{ height: '3.5rem' }} aria-hidden="true" />
      </div>
      <StickyMobileCTA whatsapp={whatsapp} />
    </>
  )
}
