import { industryStats, trendingJobRoles } from '../../data/adse'
import AdseTermIcon from './AdseTermIcon'

function StatCard({
  icon,
  title,
  points,
  source
}: {
  icon: 'globe' | 'africa'
  title: string
  points: string[]
  source: string
}) {
  return (
    <div className="card p-6 h-full flex flex-col">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--color-navy-50)', color: 'var(--color-navy-700)' }}
        >
          <AdseTermIcon term={icon} className="w-5 h-5" />
        </div>
        <h3 className="font-display font-semibold text-[var(--color-ink)] text-[1.05rem]">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3 flex-1">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-body)' }}>
            <span
              aria-hidden="true"
              className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: 'var(--color-amber-500)' }}
            />
            {p}
          </li>
        ))}
      </ul>
      <p className="mt-4 pt-3 text-xs" style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-line)' }}>
        Source: {source}
      </p>
    </div>
  )
}

export default function AdseIndustrySnapshot() {
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard icon="globe" title={industryStats.global.title} points={industryStats.global.points} source={industryStats.global.source} />
        <StatCard icon="africa" title={industryStats.africa.title} points={industryStats.africa.points} source={industryStats.africa.source} />
      </div>

      <div className="card p-6 mt-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-navy-50)', color: 'var(--color-navy-700)' }}
          >
            <AdseTermIcon term="careers" className="w-5 h-5" />
          </div>
          <h3 className="font-display font-semibold text-[var(--color-ink)] text-[1.05rem]">{trendingJobRoles.title}</h3>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {trendingJobRoles.roles.map((r) => (
            <span key={r} className="badge badge-teal">{r}</span>
          ))}
        </div>
        <p className="mt-4 pt-3 text-xs" style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-line)' }}>
          Source: {trendingJobRoles.source}
        </p>
      </div>
    </div>
  )
}
