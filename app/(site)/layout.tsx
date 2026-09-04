import { ReactNode } from 'react'
import Header from '../../components/navigation/Header'
import Footer from '../../components/footer/Footer'

/**
 * Layout for the public marketing website only (everything under the
 * (site) route group — home, about, courses, admissions, etc). This is
 * deliberately separate from the CRM at /admin, which has its own layout
 * with no public navigation or footer. See app/admin/layout.tsx.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  )
}
