import { Mail } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'
import WhatsAppButton from '../shared/WhatsAppButton'

/**
 * Left column of the registration section, mirroring the admissions page's
 * ApplyAside: heading, where registration sits in the journey, and a
 * "talk to us" card. Reuses the aside-* styles.
 */
const STEPS = [
  { step: 1, title: 'Register for a session', current: true },
  { step: 2, title: 'Join us on the day', current: false },
  { step: 3, title: 'Talk through next steps', current: false }
]

export default function EventsAside({ whatsapp, email }: { whatsapp: string; email: string }) {
  return (
    <aside className="apply-aside">
      <SectionHeading
        eyebrow="Register"
        title="Reserve your place"
        description="Choose a session and tell us who is coming. After the event, our team can help you work out which programme fits."
      />

      <ol className="aside-steps" aria-label="Where registration fits">
        {STEPS.map((s) => (
          <li key={s.step} className={`aside-step${s.current ? ' is-current' : ''}`} aria-current={s.current ? 'step' : undefined}>
            <span className="aside-step__num" aria-hidden="true">{s.step}</span>
            <span className="aside-step__title">{s.title}</span>
            {s.current && <span className="aside-step__here">You are here</span>}
          </li>
        ))}
      </ol>

      <div className="aside-help">
        <p className="aside-help__title">Not sure which event to pick?</p>
        <p className="aside-help__text">Message the team and we&apos;ll point you to the right session.</p>
        <div className="aside-help__actions">
          <WhatsAppButton
            whatsapp={whatsapp}
            variant="secondary"
            label="Chat on WhatsApp"
            contextLabel="Events and workshops registration"
            contextType="page"
            message="Hi APTECH Abeokuta, I would like help choosing an event to attend."
          />
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
