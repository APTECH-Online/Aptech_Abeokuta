import { AcnsTerm } from '../../data/acns'

export default function AcnsTermCard({ term }: { term: AcnsTerm }) {
  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center justify-between gap-4 px-5 py-4 pattern-adire"
        style={{ background: 'var(--color-navy-900)' }}
      >
        <h3 className="font-display font-semibold text-[1.05rem]" style={{ color: '#fff' }}>{term.label}</h3>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-xs font-mono font-semibold"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
        >
          {term.totalHours} Hours
        </span>
      </div>

      <div className="p-5">
        <ul className="space-y-4">
          {term.modules.map((m) => (
            <li key={m.name} className="pb-4" style={{ borderBottom: '1px solid var(--color-line)' }}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--color-ink)]">{m.name}</p>
                <span className="shrink-0 text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{m.hours} hrs</span>
              </div>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                Theory {m.theory} · Lab {m.lab} · Self-study {m.selfStudy}
              </p>
              {(m.tool || m.certification) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.tool && <span className="badge badge-navy">{m.tool}</span>}
                  {m.certification && <span className="badge badge-amber">{m.certification}</span>}
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-5 pt-4 flex flex-wrap items-center justify-between gap-3" style={{ borderTop: '1px solid var(--color-line)' }}>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Term total: <span className="font-mono font-semibold text-[var(--color-ink)]">{term.totalHours}</span> hrs
            {' '}(Theory {term.theoryTotal} · Lab {term.labTotal} · Self-study {term.selfStudyTotal})
          </p>
          <span className="badge badge-teal">Exit profile · {term.exitProfile}</span>
        </div>
      </div>
    </div>
  )
}
