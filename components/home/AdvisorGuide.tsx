'use client'

import { useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { buildWhatsAppLink, trackWhatsAppConversion } from '../../lib/whatsapp'

const OPTIONS = [
  ['Choosing a programme', 'I’d like help choosing a programme.'],
  ['Fees & payment', 'I’d like to ask about fees and payment options.'],
  ['Class schedule', 'I’d like to know about class schedules.'],
  ['Admission', 'I’d like help with admission.'],
  ['Career opportunities', 'I’d like to understand the career direction for a programme.'],
  ['Something else', 'I have another question for Admissions.']
] as const

export default function AdvisorGuide({ whatsapp, programmeName, label = 'Talk to an Academic Advisor' }: { whatsapp: string; programmeName?: string; label?: string }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const messageFor = (base: string) => programmeName ? `${base} I’m interested in the ${programmeName} programme.` : base

  return (
    <>
      <button type="button" className="btn btn-primary inline-flex items-center gap-2" onClick={() => setOpen(true)}>
        {label} <ArrowRight size={15} aria-hidden="true" />
      </button>
      {open && (
        <div className="advisor-guide__backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <div className="advisor-guide card" role="dialog" aria-modal="true" aria-labelledby="advisor-guide-title" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Academic advisor</p>
                <h2 id="advisor-guide-title" className="h-section mt-1" style={{ fontSize: '1.45rem' }}>What would you like help with?</h2>
              </div>
              <button type="button" className="advisor-guide__close" aria-label="Close" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <div className="mt-5 grid gap-2">
              {OPTIONS.map(([label, base]) => (
                <button key={label} type="button" className={`advisor-guide__option ${selected === label ? 'is-selected' : ''}`} onClick={() => setSelected(label)}>
                  <span>{label}</span><ArrowRight size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
            {selected && (
              <div className="mt-5 rounded-xl p-4" style={{ background: 'var(--color-paper-alt)', border: '1px solid var(--color-line)' }}>
                <p className="text-sm" style={{ color: 'var(--color-body)' }}>We can take you to WhatsApp with the context already prepared.</p>
                <a className="btn btn-secondary mt-3 inline-flex" target="_blank" rel="noreferrer" href={buildWhatsAppLink(whatsapp, `${messageFor(OPTIONS.find(([label]) => label === selected)?.[1] || 'Hi APTECH Abeokuta, I need help.')} ${programmeName ? `I was viewing the ${programmeName} programme.` : 'I was viewing the Academic Advisor guide.'}`)} onClick={() => trackWhatsAppConversion({ contextLabel: programmeName || `Academic Advisor: ${selected}`, contextType: 'programme' })}>
                  Continue to WhatsApp <ArrowRight size={15} aria-hidden="true" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
