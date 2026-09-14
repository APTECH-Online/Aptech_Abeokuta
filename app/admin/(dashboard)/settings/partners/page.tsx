import Link from 'next/link'
import { Building2, GraduationCap, ArrowRight } from 'lucide-react'
import { requireStaff, canManagePartners } from '../../../../../lib/auth'
import { getPartnersHighlight } from '../../../../../lib/crm/partners'
import PartnersHighlightForm from '../../../../../components/admin/PartnersHighlightForm'

export const metadata = { title: 'Partners & alliances | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function PartnersSettingsPage() {
  const staff = await requireStaff()
  const canManage = canManagePartners(staff)
  const highlight = await getPartnersHighlight()

  return (
    <div className="grid gap-8">
      <div>
        <p className="eyebrow">Content</p>
        <h1 className="h-section mt-1">Partners & alliances</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          Manage the homepage highlight card, the industry partner write-ups, and the affiliated
          university logos shown on the Home and About pages.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/settings/partners/organizations" className="card p-5 flex items-center justify-between gap-4 hover:no-underline">
          <div className="flex items-center gap-3">
            <Building2 size={22} style={{ color: 'var(--color-navy-700)' }} aria-hidden="true" />
            <div>
              <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>Industry partners</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Avigo, university alliance, and other write-ups</p>
            </div>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
        </Link>

        <Link href="/admin/settings/partners/universities" className="card p-5 flex items-center justify-between gap-4 hover:no-underline">
          <div className="flex items-center gap-3">
            <GraduationCap size={22} style={{ color: 'var(--color-navy-700)' }} aria-hidden="true" />
            <div>
              <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>Affiliated universities</p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>The logo grid on Home and About</p>
            </div>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
        </Link>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="font-display font-semibold text-[1.05rem] mb-1" style={{ color: 'var(--color-ink)' }}>
          Homepage highlight card
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>
          The single "Backed by…" card near the top of the homepage.
        </p>
        {canManage ? (
          <PartnersHighlightForm highlight={highlight} />
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            You have read-only access to this section. Ask a Super Admin for Content Manager access to edit.
          </p>
        )}
      </div>
    </div>
  )
}
