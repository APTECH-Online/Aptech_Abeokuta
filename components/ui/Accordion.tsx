'use client'
import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

export type AccordionItem = { id: string; title: string; content: string }

/**
 * Accessible single-open accordion. Every answer stays in the DOM (so it is
 * server-rendered and crawlable); closed panels are `inert` and collapsed with
 * a CSS grid-rows transition. Real <button>s inside <h3>, aria-expanded /
 * aria-controls, plus Arrow/Home/End navigation between questions.
 */
export default function Accordion({ items }: { items: AccordionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)
  const triggers = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1
    let next = -1
    if (e.key === 'ArrowDown') next = index === last ? 0 : index + 1
    else if (e.key === 'ArrowUp') next = index === 0 ? last : index - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next >= 0) { e.preventDefault(); triggers.current[next]?.focus() }
  }

  return (
    <div className="faq-list">
      {items.map((item, index) => {
        const isOpen = openId === item.id
        const panelId = `${item.id}-panel`
        const buttonId = `${item.id}-button`
        return (
          <div key={item.id} className={`faq-item${isOpen ? ' is-open' : ''}`}>
            <h3 className="faq-item__heading">
              <button
                id={buttonId}
                ref={(el) => { triggers.current[index] = el }}
                type="button"
                className="faq-item__trigger"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                onKeyDown={(e) => onKeyDown(e, index)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span className="faq-item__question">{item.title}</span>
                <span className="faq-item__icon" aria-hidden="true"><i /><i /></span>
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} className="faq-item__panel" inert={!isOpen}>
              <div className="faq-item__panel-inner"><p className="faq-item__answer">{item.content}</p></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
