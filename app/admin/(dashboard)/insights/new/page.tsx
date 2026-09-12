import { redirect } from 'next/navigation'
import { requireStaff, canManageInsights } from '../../../../../lib/auth'
import InsightForm from '../../../../../components/admin/InsightForm'

export const metadata = { title: 'Create Insight | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function NewInsightPage() {
  const staff = await requireStaff()
  if (!canManageInsights(staff)) redirect('/admin/insights')

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Create Insight</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Write a news update, announcement, event or other public content item.
        </p>
      </div>
      <InsightForm mode="create" />
    </div>
  )
}
