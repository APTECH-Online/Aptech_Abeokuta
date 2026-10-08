import { Code2, Target, Users, Milestone, LifeBuoy, Globe2 } from 'lucide-react'
import { whyChoose } from '../../data/site'
import IconTile from '../ui/IconTile'

const icons = [Code2, Target, Users, Milestone, LifeBuoy, Globe2]

export default function WhyChoose() {
  const [dominant, wide, ...rest] = whyChoose
  const DominantIcon = icons[0]

  return (
    <div className="mt-10 bento-grid">
      <div className="bento-wide card p-8 sm:p-10 relative overflow-hidden" style={{ background: 'var(--color-navy-900)', borderColor: 'var(--color-navy-900)' }}>
        <div className="pattern-adire absolute inset-0" aria-hidden="true" />
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center relative"
          style={{ background: 'rgba(239,192,119,0.15)', color: 'var(--color-amber-400)' }}
        >
          <DominantIcon aria-hidden="true" className="w-6 h-6" />
        </div>
        <h3 className="mt-5 h-section relative" style={{ color: '#fff', fontSize: 'clamp(1.35rem, 2.2vw, 1.65rem)' }}>
          {dominant.title}
        </h3>
        <p className="mt-3 leading-relaxed relative max-w-lg" style={{ color: 'rgba(255,255,255,0.68)' }}>
          {dominant.body}
        </p>
      </div>

      {[wide, ...rest].map((item, i) => {
        const Icon = icons[i + 1]
        return (
          <div key={item.id} className={`why-card ${i === 0 ? 'bento-narrow' : 'bento-sm'}`}>
            <IconTile icon={Icon} tone={i % 3 === 1 ? 'teal' : i % 3 === 2 ? 'amber' : 'navy'} />
            <h3 className="why-card__title">{item.title}</h3>
            <p className="why-card__desc">{item.body}</p>
          </div>
        )
      })}
    </div>
  )
}
