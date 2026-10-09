import Link from 'next/link'
import { ArrowRight, Check, GitCompareArrows } from 'lucide-react'

const ATTRIBUTES = ['Skills', 'Duration', 'Requirements', 'Learning format']

/** "Considering more than one option?" callout on the courses page. Light card with a mini side-by-side preview. */
export default function CompareCallout() {
  return (
    <aside className="cmpcta" aria-labelledby="cmpcta-title">
      <div className="cmpcta__main">
        <div className="cmpcta__head">
          <span className="cmpcta__icon" aria-hidden="true"><GitCompareArrows size={22} strokeWidth={1.9} /></span>
          <p className="cmpcta__eyebrow">Compare side by side</p>
        </div>
        <h2 id="cmpcta-title" className="cmpcta__title">Considering more than one option?</h2>
        <p className="cmpcta__body">Compare two or three programmes by skills, duration, requirements and learning format.</p>
        <ul className="cmpcta__chips" role="list" aria-label="What you can compare">
          {ATTRIBUTES.map((a) => (
            <li key={a}><Check size={13} strokeWidth={2.6} aria-hidden="true" />{a}</li>
          ))}
        </ul>
        <Link href="/courses/compare" className="btn btn-primary cmpcta__btn">
          Compare programmes
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {/* Decorative preview of a comparison table; hidden from assistive tech. */}
      <div className="cmpcta__preview" aria-hidden="true">
        {[0, 1, 2].map((col) => (
          <div key={col} className={`cmpcta__col cmpcta__col--${col}`}>
            <span className="cmpcta__col-head" />
            {[0, 1, 2, 3].map((row) => (
              <span key={row} className="cmpcta__row"><i /><b style={{ width: `${46 + ((col * 3 + row * 5) % 4) * 12}%` }} /></span>
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
