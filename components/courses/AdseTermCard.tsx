import { AdseTermBlock } from '../../data/adse'
import AdseTermIcon, { AdseTermKey } from './AdseTermIcon'

export default function AdseTermCard({
  term,
  icon
}: {
  term: AdseTermBlock
  icon: AdseTermKey
}) {
  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center justify-between gap-4 px-5 py-4 pattern-adire"
        style={{ background: 'var(--color-navy-900)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-amber-400)' }}
          >
            <AdseTermIcon term={icon} className="w-6 h-6" />
          </div>
          <h3 className="font-display font-semibold text-[1.05rem]" style={{ color: '#fff' }}>{term.label}</h3>
        </div>
        {term.hours && (
          <span
            className="shrink-0 rounded-full px-3 py-1 text-xs font-mono font-semibold"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
          >
            {term.hours}
          </span>
        )}
      </div>

      <div className="p-5">
        <ul className="space-y-4">
          {term.modules.map((m) => (
            <li key={m.name} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--color-amber-500)' }}
              />
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{m.name}</p>
                <p className="mt-0.5 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                  {m.outcome}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {(term.eProject || term.exitProfile) && (
          <div className="mt-5 pt-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--color-line)' }}>
            {term.eProject && <span className="badge badge-navy">eProject · {term.eProject}</span>}
            {term.exitProfile && <span className="badge badge-amber">Exit profile · {term.exitProfile}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
