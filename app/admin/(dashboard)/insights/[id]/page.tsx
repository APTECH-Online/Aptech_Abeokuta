import { notFound, redirect } from 'next/navigation'
import { requireStaff, canManageInsights } from '../../../../../lib/auth'
import { getInsightById } from '../../../../../lib/crm/insights'
import InsightForm from '../../../../../components/admin/InsightForm'

export const metadata = { title: 'Edit Insight | Admissions CRM' }
export const dynamic = 'force-dynamic'

export default async function EditInsightPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff()
  if (!canManageInsights(staff)) redirect('/admin/insights')

  const { id } = await params
  const insight = await getInsightById(id)
  if (!insight) notFound()

  return (
    <div className="grid gap-6">
      <div>
        <p className="eyebrow">Content management</p>
        <h1 className="h-section mt-1">Edit Insight</h1>
      </div>
      <InsightForm mode="edit" insight={insight} />
    </div>
  )
}
