export default function KpiCard({
  label,
  value,
  sub,
  accent = false
}: {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={`kpi-card${accent ? ' kpi-accent' : ''}`}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  )
}
