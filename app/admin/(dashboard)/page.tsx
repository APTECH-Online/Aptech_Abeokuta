import Link from 'next/link'
import { getDashboardData } from '../../../lib/crm/dashboard'
import { getInsightsDashboardStats } from '../../../lib/crm/insights'
import KpiCard from '../../../components/admin/KpiCard'
import { BarChart, LineChart, DonutChart } from '../../../components/admin/charts'

export const metadata = { title: 'Dashboard | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [data, insightsStats] = await Promise.all([getDashboardData(), getInsightsDashboardStats()])

  return (
    <div className="grid gap-8">
      <div>
        <p className="eyebrow">Overview</p>
        <h1 className="h-section mt-1">Admissions dashboard</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
          A live view of enquiries, applications, and follow-ups across every intake.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total leads" value={data.totalLeads} />
        <KpiCard label="New leads" value={data.newLeads} />
        <KpiCard label="Contacted" value={data.contacted} />
        <KpiCard label="Interested" value={data.interested} />
        <KpiCard label="Applications" value={data.applicationsCount} />
        <KpiCard label="Enrolled" value={data.enrolledCount} sub={`${data.conversionRate}% conversion`} accent />
        <KpiCard label="Follow-ups due" value={data.followUpsDueCount} sub="Overdue, pending action" />
        <KpiCard label="Sources tracked" value={data.leadsBySource.length} />
        <KpiCard label="Website enquiries" value={data.recentWebsiteEnquiries.length} sub="Latest 8 shown below" />
      </div>

      <section className="card p-5 sm:p-6">
        <p className="eyebrow mb-4">Lead pipeline</p>
        <div className="pipeline-track">
          {data.pipeline.map((stage) => (
            <div key={stage.status} className="pipeline-stage">
              <p className="pipeline-count">{stage.count}</p>
              <p className="pipeline-label">{stage.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-5 sm:p-6">
          <p className="eyebrow mb-4">Leads by month</p>
          <LineChart data={data.leadsByMonth.map((m) => ({ label: m.month, value: m.count }))} />
        </section>
        <section className="card p-5 sm:p-6">
          <p className="eyebrow mb-4">Leads by source</p>
          <DonutChart data={data.leadsBySource.map((s) => ({ label: s.source, value: s.count }))} />
        </section>
        <section className="card p-5 sm:p-6">
          <p className="eyebrow mb-4">Leads by programme</p>
          <BarChart data={data.leadsByProgramme.map((p) => ({ label: p.programme, value: p.count }))} />
        </section>
        <section className="card p-5 sm:p-6">
          <p className="eyebrow mb-4">Applications by programme</p>
          <BarChart data={data.applicationsByProgramme.map((p) => ({ label: p.programme, value: p.count }))} />
        </section>
      </div>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Website enquiries</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>Messages received through the public contact form.</p>
          </div>
          <Link href="/admin/leads" className="text-xs font-semibold" style={{ color: 'var(--color-navy-700)' }}>
            View all leads →
          </Link>
        </div>
        {data.recentWebsiteEnquiries.length === 0 ? (
          <p className="mt-5 text-sm" style={{ color: 'var(--color-muted)' }}>No website enquiries have been received yet.</p>
        ) : (
          <div className="mt-5 grid gap-3">
            {data.recentWebsiteEnquiries.map((enquiry) => (
              <Link
                key={enquiry.id}
                href={`/admin/leads/${enquiry.leadId}`}
                className="block rounded-xl border p-4 transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{enquiry.leadName}</p>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>{enquiry.email}</p>
                  </div>
                  <time className="shrink-0 text-xs" style={{ color: 'var(--color-muted)' }}>
                    {new Date(enquiry.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </time>
                </div>
                <p className="mt-3 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{enquiry.subject}</p>
                <p className="mt-1 line-clamp-2 text-sm" style={{ color: 'var(--color-muted)' }}>{enquiry.message}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Insights &amp; Events</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>News, announcements and events on the public website.</p>
          </div>
          <Link href="/admin/insights/new" className="btn btn-primary btn-sm">Create Insight</Link>
        </div>
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total insights" value={insightsStats.total} />
          <KpiCard label="Drafts" value={insightsStats.drafts} />
          <KpiCard label="Scheduled" value={insightsStats.scheduled} />
          <KpiCard label="Published" value={insightsStats.published} accent />
          <KpiCard label="Upcoming events" value={insightsStats.upcomingEvents} />
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-muted)' }}>Next scheduled content</p>
            {insightsStats.nextScheduled.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Nothing scheduled right now.</p>
            ) : (
              <ul className="grid gap-2">
                {insightsStats.nextScheduled.map((s) => (
                  <li key={s.id}>
                    <Link href={`/admin/insights/${s.id}`} className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ background: 'var(--color-navy-50)' }}>
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>{s.title}</span>
                      <span className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>
                        {new Date(s.publishAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-muted)' }}>Next upcoming events</p>
            {insightsStats.nextEvents.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No upcoming events yet.</p>
            ) : (
              <ul className="grid gap-2">
                {insightsStats.nextEvents.map((e) => (
                  <li key={e.id}>
                    <Link href={`/admin/insights/${e.id}`} className="flex items-center justify-between gap-3 p-3 rounded-lg" style={{ background: 'var(--color-teal-50)' }}>
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>{e.title}</span>
                      <span className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>
                        {new Date(e.eventStartAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Overdue follow-ups</p>
          <Link href="/admin/follow-ups" className="text-xs font-semibold" style={{ color: 'var(--color-navy-700)' }}>
            View all →
          </Link>
        </div>
        {data.overdueFollowUps.length === 0 ? (
          <p className="mt-4 text-sm" style={{ color: 'var(--color-muted)' }}>Nothing overdue right now — nice work.</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {data.overdueFollowUps.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/admin/leads/${f.leadId}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg"
                  style={{ background: 'var(--color-danger-bg)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{f.leadName}</span>
                  <span className="text-xs" style={{ color: 'var(--color-danger)' }}>
                    Was due {new Date(f.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
