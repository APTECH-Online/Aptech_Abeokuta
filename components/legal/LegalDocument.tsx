import type { ReactNode } from 'react'
import type { LegalDoc } from '../../data/legal'

type Tokens = { email: string; phone: string; address: string }

function fill(text: string, t: Tokens) {
  return text.replace(/\{\{(email|phone|address)\}\}/g, (_, k: keyof Tokens) => t[k])
}

/** Turns plain text (with {{tokens}}, a link for emails and /paths) into inline nodes. */
function inline(text: string, t: Tokens): ReactNode[] {
  const filled = fill(text, t)
  const parts = filled.split(/(\S+@\S+\.[A-Za-z]{2,}|\s\/(?:privacy|terms)\b)/g)
  return parts.map((part, i) => {
    if (/^\S+@\S+\.[A-Za-z]{2,}$/.test(part)) {
      const clean = part.replace(/[.,;]+$/, '')
      return <a key={i} href={`mailto:${clean}`} className="font-semibold underline" style={{ color: 'var(--color-navy-900)' }}>{part}</a>
    }
    if (/^\s\/(privacy|terms)$/.test(part)) {
      return <span key={i}> <a href={part.trim()} className="font-semibold underline" style={{ color: 'var(--color-navy-900)' }}>{part.trim()}</a></span>
    }
    return part
  })
}

function Body({ body, tokens }: { body: string; tokens: Tokens }) {
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        const bullets = lines.filter((l) => l.startsWith('- '))
        if (bullets.length && bullets.length === lines.length) {
          return (
            <ul key={i} className="legal-list">
              {bullets.map((l, j) => <li key={j}>{inline(l.slice(2), tokens)}</li>)}
            </ul>
          )
        }
        // Intro line(s) followed by bullets inside one block
        const firstBullet = lines.findIndex((l) => l.startsWith('- '))
        if (firstBullet > 0) {
          return (
            <div key={i}>
              <p>{inline(lines.slice(0, firstBullet).join(' '), tokens)}</p>
              <ul className="legal-list">
                {lines.slice(firstBullet).filter((l) => l.startsWith('- ')).map((l, j) => <li key={j}>{inline(l.slice(2), tokens)}</li>)}
              </ul>
            </div>
          )
        }
        return <p key={i}>{inline(block, tokens)}</p>
      })}
    </>
  )
}

export function formatLegalDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default function LegalDocument({ doc, tokens }: { doc: LegalDoc; tokens: Tokens }) {
  return (
    <article className="legal-doc card">
      <p className="legal-meta">
        Version {doc.version} · Effective {formatLegalDate(doc.effectiveDate)}
      </p>
      {doc.summary && <p className="legal-summary">{doc.summary}</p>}

      <nav aria-label="On this page" className="legal-toc">
        <p className="eyebrow">On this page</p>
        <ol>
          {doc.sections.map((s, i) => (
            <li key={i}><a href={`#section-${i + 1}`}>{s.heading}</a></li>
          ))}
        </ol>
      </nav>

      <div className="legal-sections">
        {doc.sections.map((s, i) => (
          <section key={i} id={`section-${i + 1}`} className="legal-section" aria-labelledby={`legal-h-${i + 1}`}>
            <h2 id={`legal-h-${i + 1}`}><span aria-hidden="true">{i + 1}.</span> {s.heading}</h2>
            <Body body={s.body} tokens={tokens} />
          </section>
        ))}
      </div>
    </article>
  )
}
