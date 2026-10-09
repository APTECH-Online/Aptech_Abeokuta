import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import ContactForm from '../../../components/contact/ContactForm'
import { ArrowRight, Clock, MessageSquare } from 'lucide-react'
import IconTile from '../../../components/ui/IconTile'
import ContactCards from '../../../components/contact/ContactCards'
import Link from 'next/link'
import { breadcrumbJsonLd, webPageJsonLd } from '../../../lib/structured-data'
import { getPublicContactInfo } from '../../../lib/contact-info-public'
import { buildMetadata, getSiteUrl } from '../../../lib/seo'
import OfficeMap from '../../../components/contact/OfficeMap'
import JsonLd from '../../../components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'Contact APTECH Abeokuta | Address, Phone & Enquiries',
  description:
    'Contact APTECH Abeokuta for course and admissions enquiries. Find our campus address, phone number, email and office hours, or send us a message.',
  path: '/contact'
})

export default async function Contact() {
  const baseUrl = getSiteUrl()
  const contactInfo = await getPublicContactInfo()
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Contact' }]),
          webPageJsonLd(baseUrl, { type: 'ContactPage', path: '/contact', name: 'Contact APTECH Abeokuta', description: 'Contact APTECH Abeokuta for course and admissions enquiries.' })
        ]}
      />
      <PageHero
        eyebrow="Contact"
        title="Contact APTECH Abeokuta"
        description="Have a question about a programme, admissions, or visiting the campus? Reach out — we're happy to help."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
      />

      <section className="section">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-12 items-start">
            <div className="grid gap-5 min-w-0">
              <ContactCards phone={contactInfo.phone} whatsapp={contactInfo.whatsapp} email={contactInfo.email} hours={contactInfo.hours} />
              <OfficeMap address={contactInfo.address} />
            </div>

            <div className="form-card">
              <header className="contact-form-head">
                <IconTile icon={MessageSquare} tone="navy" size="lg" />
                <div>
                  <h2 className="h-section">Send a message</h2>
                  <p className="contact-form-sub"><Clock size={14} aria-hidden="true" /> We typically respond within one to two business days.</p>
                </div>
              </header>
              <Link href="/admissions#apply" className="contact-nudge">
                <span>Ready to enrol? <strong>Start your application on the admissions page</strong></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <ContactForm whatsapp={contactInfo.whatsapp} />
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
