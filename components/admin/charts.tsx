'use client'

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
  const max = Math.max(1, ...data.map((d) => d.value))
  const width = 100
  const barWidth = data.length > 0 ? width / data.length : width

  if (data.length === 0) {
    return <EmptyState />
  }

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Bar chart">
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (height - 28)
          const x = i * barWidth + barWidth * 0.15
          const w = barWidth * 0.7
          const y = height - 20 - barHeight
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={w} height={Math.max(barHeight, d.value > 0 ? 2 : 0)} rx={1.5} fill="var(--color-navy-700)" />
              <text x={x + w / 2} y={height - 20 - barHeight - 4} fontSize="4.2" textAnchor="middle" fill="var(--color-ink)" fontWeight={700}>
                {d.value > 0 ? d.value : ''}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="flex mt-1">
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1 }} className="text-center text-[0.65rem] truncate px-0.5" title={d.label}>
            <span style={{ color: 'var(--color-muted)' }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LineChart({ data, height = 220 }: { data: { label: string; value: number }[]; height?: number }) {
  if (data.length === 0) return <EmptyState />

  const max = Math.max(1, ...data.map((d) => d.value))
  const width = 100
  const stepX = data.length > 1 ? width / (data.length - 1) : 0
  const points = data.map((d, i) => {
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
            <circle cx={p.x} cy={p.y} r={1.6} fill="var(--color-teal-700)" />
            <text x={p.x} y={p.y - 4} fontSize="4.2" textAnchor="middle" fill="var(--color-ink)" fontWeight={700}>
              {p.value > 0 ? p.value : ''}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex mt-1">
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1 }} className="text-center text-[0.65rem] truncate px-0.5">
            <span style={{ color: 'var(--color-muted)' }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DonutChart({ data, size = 180 }: { data: { label: string; value: number }[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return <EmptyState />

  const radius = 40
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Donut chart">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-line)" strokeWidth={14} />
        {data.map((d, i) => {
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
          {total}
        </text>
        <text x="50" y="58" textAnchor="middle" fontSize="6" fill="var(--color-muted)">
          total
        </text>
      </svg>
      <ul className="grid gap-1.5 text-sm w-full">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="truncate" style={{ color: 'var(--color-body)' }}>{d.label}</span>
            </span>
            <span className="font-semibold shrink-0" style={{ color: 'var(--color-ink)' }}>{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-[160px] flex items-center justify-center text-sm" style={{ color: 'var(--color-muted)' }}>
      No data yet
    </div>
  )
}
