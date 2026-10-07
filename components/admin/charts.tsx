'use client'

import { formatMetricNumber, toMetricNumber } from './metric-format'

const PALETTE = [
  'var(--color-navy-700)',
  'var(--color-teal-500)',
  'var(--color-amber-500)',
  'var(--color-navy-600)',
  'var(--color-teal-700)',
  'var(--color-amber-700)',
  'var(--color-navy-100)'
]

export function BarChart({
  data,
  height = 220
}: {
  data: { label: string; value: number }[]
  height?: number
}) {
  const chartData = data.map((d) => ({ ...d, value: toMetricNumber(d.value) }))
  const max = Math.max(1, ...chartData.map((d) => d.value))

  if (chartData.length === 0) {
    return <EmptyState />
  }

  return (
    <div
      className="admin-bar-chart"
      style={{ height }}
      role="img"
      aria-label={`Bar chart: ${chartData.map((d) => `${d.label}: ${formatMetricNumber(d.value)}`).join(', ')}`}
    >
      <div
        className="admin-bar-chart-plot"
        style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}
      >
        {chartData.map((d) => {
          const percentage = d.value > 0 ? Math.max((d.value / max) * 100, 1.5) : 0
          const formattedValue = formatMetricNumber(d.value)

          return (
            <div
              key={d.label}
              className="admin-bar-chart-column"
              title={`${d.label}: ${formattedValue}`}
            >
              <span className="admin-bar-chart-value" aria-label={formattedValue}>
                {formattedValue}
              </span>
              <div className="admin-bar-chart-track" aria-hidden="true">
                <div className="admin-bar-chart-bar" style={{ height: `${percentage}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      <div
        className="admin-bar-chart-labels"
        style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}
      >
        {chartData.map((d) => (
          <div
            key={d.label}
            className="admin-bar-chart-label"
            title={`${d.label}: ${formatMetricNumber(d.value)}`}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function LineChart({ data, height = 220 }: { data: { label: string; value: number }[]; height?: number }) {
  if (data.length === 0) return <EmptyState />

  const chartData = data.map((d) => ({ ...d, value: toMetricNumber(d.value) }))
  const max = Math.max(1, ...chartData.map((d) => d.value))
  const width = 100
  const stepX = data.length > 1 ? width / (data.length - 1) : 0
  const points = chartData.map((d, i) => {
    const x = data.length > 1 ? i * stepX : width / 2
    const y = height - 20 - (d.value / max) * (height - 34)
    return { x, y, value: d.value, label: d.label }
  })
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${path} L ${points[points.length - 1].x} ${height - 20} L ${points[0].x} ${height - 20} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Line chart">
        <path d={areaPath} fill="var(--color-teal-50)" stroke="none" />
        <path d={path} fill="none" stroke="var(--color-teal-600)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
        {points.map((p) => (
          <g key={p.label}>
            <title>{`${p.label}: ${formatMetricNumber(p.value)}`}</title>
            <circle cx={p.x} cy={p.y} r={1.6} fill="var(--color-teal-700)" />
            <text x={p.x} y={p.y - 4} fontSize="3.8" textAnchor="middle" fill="var(--color-ink)" fontWeight={700}>
              {formatMetricNumber(p.value)}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex mt-1">
        {chartData.map((d) => (
          <div key={d.label} style={{ flex: 1 }} className="text-center text-[0.65rem] truncate px-0.5" title={`${d.label}: ${formatMetricNumber(d.value)}`}>
            <span style={{ color: 'var(--color-muted)' }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DonutChart({ data, size = 180 }: { data: { label: string; value: number }[]; size?: number }) {
  const chartData = data.map((d) => ({ ...d, value: toMetricNumber(d.value) }))
  const total = chartData.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return <EmptyState />

  const radius = 40
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Donut chart">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-line)" strokeWidth={14} />
        {chartData.map((d, i) => {
          const fraction = d.value / total
          const dash = fraction * circumference
          const el = (
            <circle
              key={d.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={14}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          )
          offset += dash
          return el
        })}
        <text x="50" y="47" textAnchor="middle" fontSize="14" fontWeight={700} fill="var(--color-ink)">
          {formatMetricNumber(total)}
        </text>
        <text x="50" y="58" textAnchor="middle" fontSize="6" fill="var(--color-muted)">
          total
        </text>
      </svg>
      <ul className="grid gap-1.5 text-sm w-full">
        {chartData.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 truncate" title={`${d.label}: ${formatMetricNumber(d.value)}`}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="truncate" style={{ color: 'var(--color-body)' }}>{d.label}</span>
            </span>
            <span className="font-semibold shrink-0" style={{ color: 'var(--color-ink)' }}>{formatMetricNumber(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-[160px] flex items-center justify-center text-sm" style={{ color: 'var(--color-muted)' }}>
      Not enough data yet
    </div>
  )
}

export function MultiLineChart({
  data,
  height = 220
}: {
  data: { label: string; leads: number; applications: number; enrolled: number }[]
  height?: number
}) {
  if (data.length === 0) return <EmptyState />
  const series = [
    { key: 'leads' as const, label: 'Leads', stroke: 'var(--color-navy-700)' },
    { key: 'applications' as const, label: 'Applications', stroke: 'var(--color-teal-600)' },
    { key: 'enrolled' as const, label: 'Enrolled', stroke: 'var(--color-amber-600)' }
  ]
  const max = Math.max(1, ...data.flatMap(d => [d.leads, d.applications, d.enrolled]))
  const width = 100
  const stepX = data.length > 1 ? width / (data.length - 1) : 0
  const pointsFor = (key: 'leads'|'applications'|'enrolled') => data.map((d, i) => ({ x: data.length > 1 ? i * stepX : width / 2, y: height - 20 - (d[key] / max) * (height - 34), value: d[key], label: d.label }))
  return <div>
    <div className="flex flex-wrap gap-4 mb-2">{series.map(s => <span key={s.key} className="inline-flex items-center gap-1.5 text-xs" style={{color:'var(--color-muted)'}}><span className="w-2 h-2 rounded-full" style={{background:s.stroke}} />{s.label}</span>)}</div>
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Conversion trend chart">
      {series.map(s => { const pts = pointsFor(s.key); const path = pts.map((p,i)=>`${i===0?'M':'L'} ${p.x} ${p.y}`).join(' '); return <path key={s.key} d={path} fill="none" stroke={s.stroke} strokeWidth={1.4} vectorEffect="non-scaling-stroke" /> })}
      {series.map(s => pointsFor(s.key).map((p,i)=><circle key={`${s.key}-${i}`} cx={p.x} cy={p.y} r={1.5} fill={s.stroke}><title>{`${s.label}: ${formatMetricNumber(p.value)} (${p.label})`}</title></circle>))}
    </svg>
    <div className="flex mt-1">{data.map(d=><div key={d.label} style={{flex:1}} className="text-center text-[0.65rem] truncate px-0.5" title={d.label}><span style={{color:'var(--color-muted)'}}>{d.label}</span></div>)}</div>
  </div>
}
