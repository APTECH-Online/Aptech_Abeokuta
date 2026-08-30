import { getDashboardData } from '../../../../lib/crm/dashboard'
import { BarChart, LineChart, DonutChart } from '../../../../components/admin/charts'
import KpiCard from '../../../../components/admin/KpiCard'

export const metadata = { title: 'Reports | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const data = await getDashboardData()

  return (
    <div className="grid gap-8">
      <div>
        <p className="eyebrow">Analytics</p>
        <h1 className="h-section mt-1">Reports</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total leads" value={data.totalLeads} />
        <KpiCard label="Applications" value={data.applicationsCount} />
        <KpiCard label="Enrolled" value={data.enrolledCount} />
        <KpiCard label="Conversion rate" value={`${data.conversionRate}%`} sub="Enrolled ÷ total leads" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-5 sm:p-6">
          <p className="eyebrow mb-4">Leads by month</p>
          <LineChart data={data.leadsByMonth.map((m) => ({ label: m.month, value: m.count }))} />
        </section>
        <section className="card p-5 sm:p-6">
          <p className="eyebrow mb-4">Leads by status</p>
          <DonutChart data={data.leadsByStatus.map((s) => ({ label: s.status, value: s.count }))} />
        </section>
        <section className="card p-5 sm:p-6">
          <p className="eyebrow mb-4">Leads by source</p>
          <DonutChart data={data.leadsBySource.map((s) => ({ label: s.source, value: s.count }))} />
        </section>
        <section className="card p-5 sm:p-6">
          <p className="eyebrow mb-4">Leads by programme</p>
          <BarChart data={data.leadsByProgramme.map((p) => ({ label: p.programme, value: p.count }))} />
        </section>
        <section className="card p-5 sm:p-6 lg:col-span-2">
          <p className="eyebrow mb-4">Applications by programme</p>
          <BarChart data={data.applicationsByProgramme.map((p) => ({ label: p.programme, value: p.count }))} />
        </section>
      </div>

      <section className="card p-5 sm:p-6">
        <p className="eyebrow mb-2">Follow-ups due</p>
        <p className="kpi-value">{data.followUpsDueCount}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Pending follow-ups already past their due date.</p>
      </section>
    </div>
  )
}
