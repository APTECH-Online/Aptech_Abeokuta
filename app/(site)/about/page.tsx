import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import SectionHeading from '../../../components/ui/SectionHeading'
import CTABand from '../../../components/home/CTABand'
import StatsBand from '../../../components/home/StatsBand'
import PartnerLogos from '../../../components/shared/PartnerLogos'
import { getPublishedCourses } from '../../../lib/courses-public'
import { getPublishedPartnerOrganizations } from '../../../lib/partners-public'
import { breadcrumbJsonLd } from '../../../lib/structured-data'

export const metadata = {
  title: 'About',
  description: 'About APTECH Abeokuta — mission, vision, and approach to technology education.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About APTECH Abeokuta',
    description: 'About APTECH Abeokuta — mission, vision, and approach to technology education.',
    url: '/about'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About APTECH Abeokuta',
    description: 'About APTECH Abeokuta — mission, vision, and approach to technology education.'
  }
}

const values = [
  { title: 'Practical first', body: 'We teach by building. Every module pairs concepts with a hands-on task or project.' },
  { title: 'Career-focused', body: 'Curriculum choices are guided by what employers actually look for in entry-level tech hires.' },
  { title: 'Locally rooted', body: 'A campus in Abeokuta, built for students in Ogun State and the wider region.' }
]

export default async function About() {
  const courses = await getPublishedCourses()
  const partners = await getPublishedPartnerOrganizations()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'About' }])
          )
        }}
      />
      <PageHero
        eyebrow="About us"
        title="About APTECH Abeokuta"
        description="Career-focused technology education and practical IT training, delivered locally in Abeokuta."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
      />

      <section className="section-tight">
        <Container>
          <div className="card overflow-hidden">
            <Image
              src="/images/about-illustration.svg"
              alt="Illustration of a student working across a laptop, code panels, and a data chart"
              width={1200}
              height={420}
              className="w-full h-auto block"
            />
          </div>
        </Container>
      </section>

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
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="card p-6">
                <h3 className="font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>{v.body}</p>
              </div>
            ))}
          </div>
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
                  <div key={p.id} className="card p-6 sm:p-8">
                    <h3 className="font-display font-semibold text-[1.15rem] text-[var(--color-ink)]">{p.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>{p.body}</p>
                    <ul className="mt-5 space-y-2.5">
                      {p.points.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-body)' }}>
                          <CheckCircle2 className="shrink-0 mt-0.5" size={16} style={{ color: 'var(--color-amber-500)' }} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
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
