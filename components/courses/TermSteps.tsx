export interface TermStepItem {
  tag: string
  title: string
  note: string
  tone?: 'navy' | 'amber' | 'teal'
}

/** Compact overview cards for a programme's terms or tracks (ADSE, ACNS, Smart Pro). */
export default function TermSteps({ items, columns = 4 }: { items: TermStepItem[]; columns?: 2 | 4 }) {
  return (
    <ul className={`term-steps ${columns === 2 ? 'term-steps-2' : 'term-steps-4'}`}>
      {items.map((it) => (
        <li key={`${it.tag}-${it.title}`} className="term-step">
          <span className={`badge badge-${it.tone ?? 'navy'}`}>{it.tag}</span>
          <h3 className="term-step-title">{it.title}</h3>
          <p className="term-step-note">{it.note}</p>
        </li>
      ))}
    </ul>
  )
}
