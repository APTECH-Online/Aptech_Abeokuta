import { guardAdminPage, guardPage } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions'
import { getSeoMetrics } from '../../../../../lib/crm/seo'
import { BarChart, DonutChart } from '../../../../../components/admin/charts'
import KpiCard from '../../../../../components/admin/KpiCard'
import { Gauge, Link2, SearchCheck, FileText, Newspaper, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react'

export const metadata = { title: 'SEO Metrics | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function SeoMetricsPage() {
  await guardAdminPage((s) =>
    s.role === 'super_admin' ||
    (hasPermission(s, 'dashboard_access') && hasPermission(s, 'dashboard_view_seo_metrics'))
  )

  const seo = await guardPage(getSeoMetrics())

  return (
    <div className="grid gap-8">
      <div>
        <p className="eyebrow">Search visibility</p>
        <h1 className="h-section mt-1">SEO Metrics</h1>
        <p className="text-sm mt-2 max-w-3xl" style={{ color: 'var(--color-muted)' }}>
          First-party SEO health metrics generated from the CRM's published content, metadata, indexability flags and redirect registry. This score is not a Google ranking score.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="SEO health" value={`${seo.score}%`} sub="CRM-managed SEO layer" icon={Gauge} tone={seo.score >= 80 ? "success" : seo.score >= 60 ? "warning" : "danger"} progress={seo.score} />
        <KpiCard label="Indexable URLs" value={seo.indexableUrls} sub={`${seo.staticIndexableUrls} static · ${seo.indexableCourses + seo.indexableInsights} CMS`} icon={SearchCheck} />
        <KpiCard label="Metadata coverage" value={`${seo.customMetadataCoverage}%`} sub={`${seo.customMetadataPages} CMS pages complete`} icon={FileText} tone={seo.customMetadataCoverage >= 90 ? "success" : "warning"} progress={seo.customMetadataCoverage} />
        <KpiCard label="Sitemap eligibility" value={`${seo.sitemapEligibility}%`} sub="Expected sitemap URLs" icon={Link2} tone={seo.sitemapEligibility >= 95 ? "success" : "warning"} progress={seo.sitemapEligibility} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Published courses" value={seo.publishedCourses} sub={`${seo.indexableCourses} indexable`} icon={FileText} />
        <KpiCard label="Published insights" value={seo.publishedInsights} sub={`${seo.indexableInsights} indexable`} icon={Newspaper} />
        <KpiCard label="Redirects" value={seo.redirects} sub={`${seo.non301Redirects} non-301`} icon={RefreshCw} tone={seo.non301Redirects === 0 ? "success" : "warning"} />
        <KpiCard label="Review due" value={seo.staleContent} sub="Published content 180+ days old" icon={AlertTriangle} tone={seo.staleContent === 0 ? "success" : "warning"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-5 sm:p-6">
          <p className="eyebrow mb-4">Published vs indexable content</p>
          <BarChart
            data={[
              { label: 'Courses · published', value: seo.publishedCourses },
              { label: 'Courses · indexable', value: seo.indexableCourses },
              { label: 'Insights · published', value: seo.publishedInsights },
              { label: 'Insights · indexable', value: seo.indexableInsights }
            ]}
          />
        </section>
        <section className="card p-5 sm:p-6">
          <p className="eyebrow mb-4">Insights by content type</p>
          <DonutChart data={seo.byContentType.map((item) => ({ label: item.label, value: item.count }))} />
        </section>
      </div>

      <section className="card p-5 sm:p-6">
        <p className="eyebrow mb-4">SEO coverage details</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Missing custom metadata</p>
            <div className="metric-highlight"><FileText size={16} aria-hidden="true" /><p className="kpi-value mt-1">{seo.missingCustomMetadataPages}</p></div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Generated fallbacks still work, but these records do not have a custom SEO title and description.</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Intentional noindex</p>
            <div className="metric-highlight"><ShieldCheck size={16} aria-hidden="true" /><p className="kpi-value mt-1">{seo.noindexContent}</p></div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Published CMS records deliberately excluded from indexing.</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Redirect chain risks</p>
            <div className="metric-highlight"><AlertTriangle size={16} aria-hidden="true" /><p className="kpi-value mt-1">{seo.redirectChainRisks}</p></div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Redirect destinations that are themselves registered redirect sources.</p>
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <p className="eyebrow mb-4">Issues to review</p>
        {seo.issues.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No CRM-detectable SEO issues found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Page</th>
                  <th className="py-2 pr-4">Path</th>
                  <th className="py-2">Issue</th>
                </tr>
              </thead>
              <tbody>
                {seo.issues.map((issue, index) => (
                  <tr key={`${issue.path}-${index}`} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{issue.title}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{issue.path}</td>
                    <td className="py-3" style={{ color: 'var(--color-muted)' }}>{issue.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <p className="eyebrow mb-2">Data boundary</p>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          This CRM page reports first-party on-site SEO health. Google Search Console performance metrics such as impressions, clicks, CTR and average position are not fabricated; they require a Search Console data connection before they can be shown here.
        </p>
        <p className="text-xs mt-3" style={{ color: 'var(--color-muted)' }}>Last generated: {new Date(seo.generatedAt).toLocaleString('en-NG')}</p>
      </section>
    </div>
  )
}
