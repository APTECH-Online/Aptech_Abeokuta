import Link from 'next/link'
import { ExternalLink, FileText, ShieldCheck } from 'lucide-react'
import { guardAdminPage } from '../../../../../lib/auth'
import { hasAnyModulePermission } from '../../../../../lib/permissions'
import { ensureLegalSeeded, getConsentOverview, listLegalDocuments } from '../../../../../lib/crm/legal'
import { LEGAL_LABELS, LEGAL_PATHS, LEGAL_SLUGS } from '../../../../../data/legal'
import StatusBadge from '../../../../../components/admin/StatusBadge'

export const metadata = { title: 'Legal & policies | Admissions CRM' }
export const dynamic = 'force-dynamic'

const fmt = (v: string | null) => (v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export default async function LegalSettingsPage() {
  await guardAdminPage((s) => s.role === 'super_admin' || hasAnyModulePermission(s, 'website_content'))
  await ensureLegalSeeded()
  const [docs, overview] = await Promise.all([listLegalDocuments(), getConsentOverview()])

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content</p>
        <h1 className="h-section mt-1">Legal &amp; policies</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          Edit the Privacy Policy and Terms &amp; Conditions shown on the website. Every change is versioned, and each enquiry records the versions that were live when the person agreed.
        </p>
      </div>

      <div className="card p-4 text-sm" style={{ background: 'var(--color-amber-100)', borderColor: 'var(--color-amber-400)', color: 'var(--color-ink)' }}>
        <strong>Before publishing:</strong> these texts describe how this website works today, but they are not legal advice. Have a Nigerian lawyer or data protection professional review them, particularly the retention, sharing and refund wording.
      </div>

      <section aria-label="Consent overview" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Leads with consent on record', value: overview.withConsent },
          { label: 'Marketing opt-ins', value: overview.marketing },
          { label: 'Under-18 applicants flagged', value: overview.minors },
          { label: 'Older leads with no consent record', value: overview.withoutConsent }
        ].map((m) => (
          <div key={m.label} className="card p-4">
            <p className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>{m.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{m.label}</p>
          </div>
        ))}
      </section>

      {LEGAL_SLUGS.map((slug) => {
        const rows = docs.filter((d) => d.slug === slug)
        const live = rows.find((r) => r.status === 'published')
        const draft = rows.find((r) => r.status === 'draft')
        return (
          <section key={slug} className="card p-5 sm:p-6 grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow flex items-center gap-2">{slug === 'privacy' ? <ShieldCheck size={14} aria-hidden="true" /> : <FileText size={14} aria-hidden="true" />} {LEGAL_LABELS[slug]}</p>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-body)' }}>
                  {live ? <>Live: version {live.version}, effective {fmt(live.effective_date)}.</> : 'Showing the built-in default text.'}
                  {draft && <> A draft (version {draft.version}) is in progress.</>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={LEGAL_PATHS[slug]} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">View live <ExternalLink size={14} aria-hidden="true" /></a>
                <Link href={`/admin/settings/legal/${slug}`} className="btn btn-secondary btn-sm">{draft ? 'Continue draft' : 'Edit'}</Link>
              </div>
            </div>

            {rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ color: 'var(--color-muted)' }}>
                      <th className="py-2 pr-4 font-semibold">Version</th>
                      <th className="py-2 pr-4 font-semibold">Status</th>
                      <th className="py-2 pr-4 font-semibold">Effective</th>
                      <th className="py-2 pr-4 font-semibold">Published</th>
                      <th className="py-2 font-semibold">What changed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} style={{ borderTop: '1px solid var(--color-line)' }}>
                        <td className="py-2 pr-4 font-mono">v{r.version}</td>
                        <td className="py-2 pr-4"><StatusBadge status={r.status} label={r.status[0].toUpperCase() + r.status.slice(1)} /></td>
                        <td className="py-2 pr-4 whitespace-nowrap">{fmt(r.effective_date)}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{fmt(r.published_at)}</td>
                        <td className="py-2" style={{ color: 'var(--color-body)' }}>{r.change_summary || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
