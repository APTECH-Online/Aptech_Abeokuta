import { SmartProBlock } from '../../data/smartpro'

export default function SmartProTrackCard({ block }: { block: SmartProBlock }) {
  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center justify-between gap-4 px-5 py-4 pattern-adire"
        style={{ background: 'var(--color-navy-900)' }}
      >
        <h3 className="font-display font-semibold text-[1.05rem]" style={{ color: '#fff' }}>{block.label}</h3>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-xs font-mono font-semibold"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
        >
          {block.hours}
        </span>
      </div>

      <div className="p-5">
        {block.about && (
          <ul className="space-y-2 mb-5 pb-5" style={{ borderBottom: '1px solid var(--color-line)' }}>
            {block.about.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--color-body)' }}>
                <span aria-hidden="true" className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-teal-700)' }} />
                {line}
              </li>
            ))}
          </ul>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--color-muted)' }}>
              <th className="text-left font-semibold pb-2">Module</th>
              <th className="text-right font-semibold pb-2 whitespace-nowrap">Hours</th>
            </tr>
          </thead>
          <tbody>
            {block.modules.map((m) => (
              <tr key={m.name} style={{ borderTop: '1px solid var(--color-line)' }}>
                <td className="py-2 pr-3 text-[var(--color-ink)]">{m.name}</td>
                <td className="py-2 text-right font-mono" style={{ color: 'var(--color-muted)' }}>{m.hours}</td>
              </tr>
            ))}
            <tr style={{ borderTop: '1px solid var(--color-line)' }}>
              <td className="py-2 pr-3 font-semibold text-[var(--color-ink)]">Total</td>
              <td className="py-2 text-right font-mono font-semibold text-[var(--color-ink)]">{block.hours.replace(' Hours', '')}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-5 pt-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--color-line)' }}>
          {block.diploma && (
            <span className="badge badge-amber">
              {block.diploma.name} · {block.diploma.hours}
            </span>
          )}
          {block.jobProfiles?.map((j) => (
            <span key={j} className="badge badge-navy">Job profile · {j}</span>
          ))}
        </div>

        <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          <span className="font-semibold">Software training:</span> {block.softwareTraining.join(', ')}
        </p>
      </div>
    </div>
  )
}
