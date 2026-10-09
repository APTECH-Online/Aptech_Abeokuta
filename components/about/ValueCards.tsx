import { Hammer, Briefcase, MapPin, type LucideIcon } from 'lucide-react'
import IconTile from '../ui/IconTile'

type Tone = 'navy' | 'amber' | 'teal'
type Value = { title: string; body: string; tag: string; icon: LucideIcon; tone: Tone }

const VALUES: Value[] = [
  { title: 'Practical first', body: 'We teach by building. Every module pairs concepts with a hands-on task or project.', tag: 'Learn by doing', icon: Hammer, tone: 'navy' },
  { title: 'Career-focused', body: 'Curriculum choices are guided by what employers actually look for in entry-level tech hires.', tag: 'Built for employers', icon: Briefcase, tone: 'amber' },
  { title: 'Locally rooted', body: 'A campus in Abeokuta, built for students in Ogun State and the wider region.', tag: 'Close to home', icon: MapPin, tone: 'teal' }
]

/** "What we value" cards on the About page: numbered, icon-led, with a tone accent per value. */
export default function ValueCards() {
  return (
    <ul className="value-grid" role="list">
      {VALUES.map((v, i) => (
        <li key={v.title} className={`value-card value-card--${v.tone}`}>
          <span className="value-card__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
          <IconTile icon={v.icon} tone={v.tone} size="lg" className="value-card__icon" />
          <p className="value-card__tag">{v.tag}</p>
          <h3 className="value-card__title">{v.title}</h3>
          <p className="value-card__body">{v.body}</p>
        </li>
      ))}
    </ul>
  )
}
