import type { LucideIcon } from 'lucide-react'
import IconTile from '../ui/IconTile'

type Pillar = { icon: LucideIcon; title: string; body: string }
const TONES = ['navy', 'amber', 'teal'] as const

/** "What campus life actually looks like": numbered pillar cards with rotating tile colours. */
export default function LifeCards({ items }: { items: Pillar[] }) {
  return (
    <ul className="life-grid">
      {items.map((p, i) => (
        <li key={p.title} className="life-card">
          <div className="life-card__top">
            <IconTile icon={p.icon} tone={TONES[i % TONES.length]} size="lg" />
            <span className="life-card__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
          </div>
          <h3 className="life-card__title">{p.title}</h3>
          <p className="life-card__body">{p.body}</p>
        </li>
      ))}
    </ul>
  )
}
