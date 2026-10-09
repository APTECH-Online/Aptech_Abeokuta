import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, GraduationCap, Target, Trophy } from 'lucide-react'
import IconTile from '../ui/IconTile'

/**
 * Events feature on /student-life. All copy restates what the page already
 * said about Aptech Career Quest (nationwide, with Middlesex University,
 * classroom skills tested off campus); nothing new is claimed.
 */
const FACTS = [
  { icon: Trophy, label: 'A nationwide competition' },
  { icon: GraduationCap, label: 'Held in association with Middlesex University' },
  { icon: Target, label: 'Classroom skills put to the test beyond the campus' }
]

export default function EventFeature() {
  return (
    <div className="event-feature">
      <div className="event-media">
        <div className="event-media__frame">
          <Image
            src="/images/gallery/event-1.jpg"
            alt="A group of students at the APTECH Career Quest event, held in association with Middlesex University"
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
          <span className="event-media__badge">Featured event</span>
        </div>
      </div>
      <div className="event-copy">
        <p className="eyebrow">Events</p>
        <h2 className="h-section mt-2">Aptech Career Quest</h2>
        <p className="mt-3 lede">
          Students take part in Aptech Career Quest, a nationwide competition held in association with
          Middlesex University — a chance to put classroom skills to the test outside the campus.
        </p>
        <ul className="event-facts">
          {FACTS.map((f) => (
            <li key={f.label} className="event-fact">
              <IconTile icon={f.icon} tone="amber" size="sm" />
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
        <Link href="/gallery" className="btn btn-primary event-cta">
          See more from the gallery
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
