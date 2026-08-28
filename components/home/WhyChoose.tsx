import { Code2, Target, Users, Milestone, LifeBuoy, Globe2 } from 'lucide-react'
import { whyChoose } from '../../data/site'

const icons = [Code2, Target, Users, Milestone, LifeBuoy, Globe2]

export default function WhyChoose() {
  const [dominant, wide, ...rest] = whyChoose
  const DominantIcon = icons[0]
  const WideIcon = icons[1]

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

      <div className="bento-narrow card p-7 flex flex-col justify-between">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--color-teal-50)', color: 'var(--color-teal-700)' }}
        >
          <WideIcon aria-hidden="true" className="w-5 h-5" />
        </div>
        <div>
          <h3 className="mt-4 font-display font-semibold text-[1.02rem] text-[var(--color-ink)]">{wide.title}</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>{wide.body}</p>
        </div>
      </div>

      {rest.map((item, i) => {
        const Icon = icons[i + 2]
        return (
          <div key={item.id} className="bento-sm card p-6">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-amber-100)', color: 'var(--color-amber-700)' }}
            >
              <Icon aria-hidden="true" className="w-5 h-5" />
            </div>
            <h3 className="mt-4 font-display font-semibold text-[0.98rem] text-[var(--color-ink)]">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>{item.body}</p>
          </div>
        )
      })}
    </div>
  )
}
