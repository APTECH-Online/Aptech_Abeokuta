'use client'
import { useState } from 'react'

export type AccordionItem = { id: string; title: string; content: string }

export default function Accordion({ items }: { items: AccordionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id
        const panelId = `${item.id}-panel`
        const buttonId = `${item.id}-button`
        return (
          <div key={item.id} className="card overflow-hidden">
            <h3>
              <button
                id={buttonId}
                className="w-full text-left px-5 py-4 flex justify-between items-center gap-4"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span className="font-semibold text-[var(--color-ink)]">{item.title}</span>
                <span
                  aria-hidden="true"
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm"
                  style={{ background: 'var(--color-navy-50)', color: 'var(--color-navy-700)' }}
                >
                  {isOpen ? '−' : '+'}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-5 pb-5 pt-0 text-sm leading-relaxed"
              style={{ color: 'var(--color-body)' }}
            >
              {item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
