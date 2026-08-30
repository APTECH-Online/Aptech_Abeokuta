export default function KpiCard({
  label,
  value,
  sub
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  )
}
