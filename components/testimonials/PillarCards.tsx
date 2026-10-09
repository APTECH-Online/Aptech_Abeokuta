import { FlaskConical, HeartHandshake, Users, type LucideIcon } from 'lucide-react'

type Tone = 'navy' | 'teal' | 'amber'
type Pillar = { label: string; title: string; body: string; chips: string[]; icon: LucideIcon; tone: Tone }

const PILLARS: Pillar[] = [
  { label: 'Practical', title: 'Learn by doing', body: 'Every programme is built around hands-on projects and lab-based practice, not passive lectures.', chips: ['Hands-on projects', 'Lab practice'], icon: FlaskConical, tone: 'navy' },
  { label: 'Support', title: 'Guidance matters', body: 'Instructors stay accessible throughout, with a structured pathway from fundamentals to applied work.', chips: ['Accessible instructors', 'Structured pathway'], icon: HeartHandshake, tone: 'teal' },
  { label: 'Community', title: 'A local learning community', body: 'A campus in Abeokuta, connected to the wider APTECH computer education network.', chips: ['Abeokuta campus', 'APTECH network'], icon: Users, tone: 'amber' }
]

/** Practical / Support / Community pillars shown under the student stories. */
export default function PillarCards() {
  return (
    <ul className="pillar-grid" role="list" aria-label="What students say sets APTECH Abeokuta apart">
      {PILLARS.map(({ label, title, body, chips, icon: Icon, tone }) => (
        <li key={label} className={`pillar-card pillar-card--${tone}`}>
          <Icon className="pillar-card__watermark" size={120} strokeWidth={1.2} aria-hidden="true" />
          <div className="pillar-card__head">
            <span className="pillar-card__icon" aria-hidden="true"><Icon size={21} strokeWidth={1.9} /></span>
            <span className="pillar-card__label">{label}</span>
          </div>
          <h3 className="pillar-card__title">{title}</h3>
          <p className="pillar-card__body">{body}</p>
          <ul className="pillar-card__chips" role="list">
            {chips.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </li>
      ))}
    </ul>
  )
}
