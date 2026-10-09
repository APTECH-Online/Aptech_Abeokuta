import { Mail } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'
import WhatsAppButton from '../shared/WhatsAppButton'
import { admissionsSteps } from '../../data/site'

/**
 * Left column of the "Application" section: heading, a compact reminder of
 * where the enquiry sits in the four-step process, and a "talk to us" card.
 * Steps come from data/site.ts so they stay in sync with the How-to-apply list.
 */
export default function ApplyAside({ whatsapp, email }: { whatsapp: string; email: string }) {
  return (
    <aside className="apply-aside">
      <SectionHeading
        eyebrow="Application"
        title="Submit an enquiry"
        description="Tell us about yourself and the programme you're interested in — the admissions team will follow up with next steps."
      />

      <ol className="aside-steps" aria-label="Where this fits in the process">
        {admissionsSteps.map((s) => {
          const current = s.step === 2
          return (
            <li key={s.step} className={`aside-step${current ? ' is-current' : ''}`} aria-current={current ? 'step' : undefined}>
              <span className="aside-step__num" aria-hidden="true">{s.step}</span>
              <span className="aside-step__title">{s.title}</span>
              {current && <span className="aside-step__here">You are here</span>}
            </li>
          )
        })}
      </ol>

      <div className="aside-help">
        <p className="aside-help__title">Prefer to talk first?</p>
        <p className="aside-help__text">Message the admissions team and we&apos;ll help you pick a programme.</p>
        <div className="aside-help__actions">
          <WhatsAppButton whatsapp={whatsapp} variant="secondary" label="Chat on WhatsApp" contextLabel="Admissions and programme selection" contextType="programme" message="Hi APTECH Abeokuta, I would like advice on choosing the right programme." />
          {email && (
            <a href={`mailto:${email}`} className="aside-help__mail">
              <Mail size={15} aria-hidden="true" />
              {email}
            </a>
          )}
        </div>
      </div>
    </aside>
  )
}
