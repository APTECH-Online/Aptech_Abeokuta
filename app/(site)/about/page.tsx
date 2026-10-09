import Link from 'next/link'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import SectionHeading from '../../../components/ui/SectionHeading'
import CTABand from '../../../components/home/CTABand'
import StatsBand from '../../../components/home/StatsBand'
import PartnerCard from '../../../components/shared/PartnerCard'
import PartnerLogos from '../../../components/shared/PartnerLogos'
import { getPublishedCourses } from '../../../lib/courses-public'
import { getPublishedPartnerOrganizations } from '../../../lib/partners-public'
import { breadcrumbJsonLd, webPageJsonLd } from '../../../lib/structured-data'
import { buildMetadata, getSiteUrl } from '../../../lib/seo'
import JsonLd from '../../../components/shared/JsonLd'
import AboutJourney from '../../../components/about/AboutJourney'
import ValueCards from '../../../components/about/ValueCards'

export const metadata = buildMetadata({
  title: 'About APTECH Abeokuta | IT Training Centre in Ogun State',
  description:
    'Learn about APTECH Abeokuta: our mission, vision and hands-on approach to technology education for students in Abeokuta, Ogun State and the wider region.',
  path: '/about'
})

export default async function About() {
  const courses = await getPublishedCourses()
  const partners = await getPublishedPartnerOrganizations()
  const baseUrl = getSiteUrl()
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'About' }]),
          webPageJsonLd(baseUrl, { type: 'AboutPage', path: '/about', name: 'About APTECH Abeokuta', description: 'Career-focused technology education and practical IT training, delivered locally in Abeokuta.' })
        ]}
      />
      <PageHero
        eyebrow="About us"
        title="About APTECH Abeokuta"
        description="Career-focused technology education and practical IT training, delivered locally in Abeokuta."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
      />

      <AboutJourney />

      <section className="section">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="eyebrow">Mission</p>
              <h2 className="h-section mt-2">Deliver industry-relevant training and career pathways.</h2>
              <p className="lede mt-4">
                APTECH Abeokuta provides career-focused technology education and practical IT
                training for students at every stage — from complete beginners to those looking
                to sharpen professional IT skills.
              </p>
            </div>
            <div>
              <p className="eyebrow">Vision</p>
              <h2 className="h-section mt-2">Empower students to succeed in the digital economy.</h2>
              <p className="lede mt-4">
                We aim to be a trusted local starting point for a technology career: practical
                enough to build real skill, structured enough to build real confidence.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/admissions" className="btn btn-primary">See admissions</Link>
          </div>
        </Container>
      </section>

      <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
        <Container>
          <SectionHeading eyebrow="What we value" title="How we approach training" />
          <div className="mt-8"><ValueCards /></div>
        </Container>
      </section>

      <StatsBand courses={courses} />

      <section id="partners" className="section-tight scroll-mt-24" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
        <Container>
          <SectionHeading eyebrow="Partners & alliances" title="Backed by industry, connected to academia" />
          {partners.length > 0 && (
            <>
              <p className="eyebrow mt-2">Industry partners</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {partners.map((p) => (
                  <PartnerCard key={p.id} partner={p} />
                ))}
              </div>
            </>
          )}

          <PartnerLogos />
        </Container>
      </section>

      <section className="section-tight">
        <Container>
          <CTABand
            title="Want to see the full curriculum?"
            description="Browse every training track offered at APTECH Abeokuta."
            primary={{ label: 'Browse courses', href: '/courses' }}
            secondary={{ label: 'Contact us', href: '/contact' }}
          />
        </Container>
      </section>
    </>
  )
}
