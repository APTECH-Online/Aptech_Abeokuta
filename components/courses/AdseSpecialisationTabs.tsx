'use client'
import { useState } from 'react'
import { adseTerm4Specialised } from '../../data/adse'
import AdseTermIcon, { AdseTermKey } from './AdseTermIcon'

const iconFor: Record<string, AdseTermKey> = {
  'term-4e': 'data-science',
  'term-4f': 'ai-ml',
  'term-4g': 'iot'
}

const shortLabel: Record<string, string> = {
  'term-4e': 'Data Science',
  'term-4f': 'AI & Machine Learning',
  'term-4g': 'Internet of Things'
}

export default function AdseSpecialisationTabs() {
  const [activeId, setActiveId] = useState(adseTerm4Specialised[0].id)
  const active = adseTerm4Specialised.find((t) => t.id === activeId) ?? adseTerm4Specialised[0]
  const icon = iconFor[active.id]

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Term 4 specialisation tracks">
        {adseTerm4Specialised.map((t) => {
          const isActive = t.id === activeId
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(t.id)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={
                isActive
                  ? { background: 'var(--color-navy-900)', color: '#fff' }
                  : { background: 'var(--color-navy-50)', color: 'var(--color-navy-700)' }
              }
            >
              <AdseTermIcon term={iconFor[t.id]} className="w-4 h-4" />
              {shortLabel[t.id]}
            </button>
          )
        })}
      </div>

      <div className="card mt-5 overflow-hidden">
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
            <h3 className="font-display font-semibold text-[1.05rem]" style={{ color: '#fff' }}>{active.label}</h3>
          </div>
          {active.hours && (
            <span
              className="shrink-0 rounded-full px-3 py-1 text-xs font-mono font-semibold"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
            >
              {active.hours}
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {active.modules.map((m) => (
              <div key={m.name} className="flex items-start gap-3">
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
              </div>
            ))}
          </div>

          {(active.eProject || active.exitProfile) && (
            <div className="mt-5 pt-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--color-line)' }}>
              {active.eProject && <span className="badge badge-navy">eProject · {active.eProject}</span>}
              {active.exitProfile && <span className="badge badge-amber">Exit profile · {active.exitProfile}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
