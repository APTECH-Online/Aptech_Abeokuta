import { Suspense } from 'react'
import Link from 'next/link'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import SectionHeading from '../../../components/ui/SectionHeading'
import Accordion from '../../../components/ui/Accordion'
import AdmissionsForm from '../../../components/admissions/AdmissionsForm'
import { RequirementsChecklist, IntakesAndFees } from '../../../components/admissions/AdmissionsInfo'
import ApplyAside from '../../../components/admissions/ApplyAside'
import ApplySteps from '../../../components/admissions/ApplySteps'
import { admissionsRequirements } from '../../../data/site'
import { getPublishedFaqs } from '../../../lib/faqs-public'
import { getActiveProgrammesForPublicForm } from './programmes'
import { breadcrumbJsonLd, faqJsonLd } from '../../../lib/structured-data'
import { getPublicContactInfo } from '../../../lib/contact-info-public'
import { buildMetadata, getSiteUrl } from '../../../lib/seo'
import JsonLd from '../../../components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'Admissions & How to Apply | APTECH Abeokuta',
  description:
    'How to apply to APTECH Abeokuta: choose a programme, submit your enquiry, attend orientation and start learning. See requirements and contact admissions.',
  path: '/admissions'
})

export default async function Admissions() {
  const faqs = await getPublishedFaqs(3)
  const faqItems = faqs.map((f) => ({ id: f.id, title: f.question, content: f.answer }))
  const programmes = await getActiveProgrammesForPublicForm()
  const { whatsapp, email } = await getPublicContactInfo()
  const baseUrl = getSiteUrl()

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Admissions' }]),
        faqJsonLd(faqs.map((f) => ({ question: f.question, answer: f.answer })))
      ]} />
      <PageHero
        eyebrow="Admissions"
        title="Apply to APTECH Abeokuta"
        description="A straightforward, four-step process from choosing a programme to your first day of class."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Admissions' }]}
      >
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="#apply" className="btn btn-accent">Apply now</Link>
          <Link href="/book-consultation" className="btn btn-secondary btn-secondary-on-dark">Book counselling</Link>
          <Link href="/courses" className="btn btn-secondary btn-secondary-on-dark">
            Browse courses first
          </Link>
        </div>
      </PageHero>

      <section className="section">
        <Container>
          <SectionHeading eyebrow="Process" title="How to apply" />
          <div className="mt-10"><ApplySteps /></div>
        </Container>
      </section>

      <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
            <div className="flex flex-col">
              <SectionHeading eyebrow="What you'll need" title="Requirements" />
              <div className="mt-6 flex-1 flex flex-col"><RequirementsChecklist items={admissionsRequirements} /></div>
            </div>
            <div className="flex flex-col">
              <SectionHeading eyebrow="Good to know" title="Intakes & fees" />
              <div className="mt-6 flex-1 flex flex-col"><IntakesAndFees /></div>
            </div>
          </div>
        </Container>
      </section>

      <section id="apply" className="section scroll-mt-20">
        <Container className="max-w-5xl">
          <div className="apply-layout">
            <ApplyAside whatsapp={whatsapp} email={email} />
            <div className="min-w-0">
              {programmes.length > 0 ? (
                <Suspense fallback={<div className="form-card text-sm" style={{ color: 'var(--color-muted)' }}>Loading form…</div>}>
                  <AdmissionsForm programmes={programmes} whatsapp={whatsapp} />
                </Suspense>
              ) : (
                <div className="form-card text-sm" style={{ color: 'var(--color-muted)' }}>
                  The enquiry form is temporarily unavailable. Please contact admissions directly at{' '}
                  <a href={`mailto:${email}`} className="underline">{email}</a>.
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)' }}>
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="Common questions" title="Admissions FAQ" />
          <div className="mt-8">
            <Accordion items={faqItems} />
          </div>
        </Container>
      </section>
    </>
  )
}
