import type { LucideIcon } from 'lucide-react'

export default function KpiCard({
  label,
  value,
  sub,
  accent = false,
  icon: Icon,
  tone = 'neutral',
  progress
}: {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  icon?: LucideIcon
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
  progress?: number
}) {
  const safeProgress = typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : null
  return (
    <div className={`kpi-card kpi-card-${tone}${accent ? ' kpi-accent' : ''}`}>
      <div className="kpi-head">
        <p className="kpi-label">{label}</p>
        {Icon && <span className="kpi-icon" aria-hidden="true"><Icon size={16} /></span>}
      </div>
      <p className="kpi-value">{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
      {safeProgress !== null && (
        <div className="kpi-progress" aria-label={`${safeProgress}%`}>
          <span style={{ width: `${safeProgress}%` }} />
        </div>
      )}
    </div>
  )
}
