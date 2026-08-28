import Link from 'next/link'
import PageHero from '../../components/shared/PageHero'
import Container from '../../components/ui/Container'
import SectionHeading from '../../components/ui/SectionHeading'
import Accordion from '../../components/ui/Accordion'
import { admissionsSteps, admissionsRequirements, faqs } from '../../data/site'

export const metadata = {
  title: 'Admissions',
  description: 'How to apply to APTECH Abeokuta — steps, requirements, and what to expect.'
}

export default function Admissions() {
  const faqItems = faqs.slice(0, 3).map((f) => ({ id: f.id, title: f.question, content: f.answer }))

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
          <form className="mt-8 card p-6 sm:p-8 grid gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="full-name" className="field-label">Full name</label>
                <input id="full-name" name="full-name" required className="field-input" placeholder="Your full name" />
              </div>
              <div>
                <label htmlFor="phone" className="field-label">Phone number</label>
                <input id="phone" name="phone" type="tel" required className="field-input" placeholder="e.g. 080X XXX XXXX" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="field-label">Email address</label>
              <input id="email" name="email" type="email" required className="field-input" placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="programme" className="field-label">Programme of interest</label>
              <select id="programme" name="programme" className="field-select" defaultValue="">
                <option value="" disabled>Select a programme</option>
                <option>Advanced Diploma in Software Engineering</option>
                <option>Smart Pro</option>
                <option>Aptech Certified Network Specialist</option>
                <option>Short Term Courses</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="field-label">Message (optional)</label>
              <textarea id="message" name="message" className="field-textarea" placeholder="Anything you'd like the admissions team to know" />
            </div>
            <button type="submit" className="btn btn-primary btn-block sm:w-auto sm:justify-self-start">
              Submit application
            </button>
            <p className="field-hint">
              This is a front-end demo form — connect it to your admissions inbox or CRM before launch.
            </p>
          </form>
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
