import { Suspense } from 'react'
import Link from 'next/link'
import PageHero from '../../components/shared/PageHero'
import Container from '../../components/ui/Container'
import SectionHeading from '../../components/ui/SectionHeading'
import Accordion from '../../components/ui/Accordion'
import AdmissionsForm from '../../components/admissions/AdmissionsForm'
import { admissionsSteps, admissionsRequirements, faqs } from '../../data/site'
import { getActiveProgrammesForPublicForm } from './programmes'

export const metadata = {
  title: 'Admissions',
  description: 'How to apply to APTECH Abeokuta — steps, requirements, and what to expect.'
}

export default async function Admissions() {
  const faqItems = faqs.slice(0, 3).map((f) => ({ id: f.id, title: f.question, content: f.answer }))
  const programmes = await getActiveProgrammesForPublicForm()

  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Start your application"
        description="A straightforward, four-step process from choosing a programme to your first day of class."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Admissions' }]}
      >
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="#apply" className="btn btn-accent">Apply now</Link>
          <Link href="/courses" className="btn btn-secondary" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
            Browse courses first
          </Link>
        </div>
      </PageHero>

      <section className="section">
        <Container>
          <SectionHeading eyebrow="Process" title="How to apply" />
          <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {admissionsSteps.map((s) => (
              <li key={s.step} className="card p-6 relative">
                <span className="eyebrow">{`STEP_${String(s.step).padStart(2, '0')}`}</span>
                <h3 className="mt-2 font-display font-semibold text-[1.05rem] text-[var(--color-ink)]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <SectionHeading eyebrow="What you'll need" title="Requirements" />
              <ul className="mt-6 space-y-3">
                {admissionsRequirements.map((r) => (
                  <li key={r} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-body)' }}>
                    <span
                      aria-hidden="true"
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0"
                      style={{ background: 'var(--color-teal-50)', color: 'var(--color-teal-700)' }}
                    >
                      ✓
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionHeading eyebrow="Good to know" title="Intakes & fees" />
              <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                Intake dates and fee structures vary by programme and are confirmed directly with
                the admissions office. Get in touch and we'll walk you through current options for
                your chosen track.
              </p>
              <Link href="/contact" className="btn btn-secondary mt-5">Ask admissions a question</Link>
            </div>
          </div>
        </Container>
      </section>

      <section id="apply" className="section">
        <Container className="max-w-2xl">
          <SectionHeading eyebrow="Application" title="Submit an enquiry" description="Tell us about yourself and the programme you're interested in — the admissions team will follow up with next steps." />
          {programmes.length > 0 ? (
            <Suspense fallback={<div className="mt-8 card p-8 text-sm" style={{ color: 'var(--color-muted)' }}>Loading form…</div>}>
              <AdmissionsForm programmes={programmes} />
            </Suspense>
          ) : (
            <div className="mt-8 card p-6 sm:p-8 text-sm" style={{ color: 'var(--color-muted)' }}>
              The enquiry form is temporarily unavailable. Please contact admissions directly at{' '}
              <a href="mailto:aptech.abeokuta@gmail.com" className="underline">aptech.abeokuta@gmail.com</a>.
            </div>
          )}
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
