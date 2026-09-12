import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireStaff } from '../../../../../../lib/auth'
import { getInsightById } from '../../../../../../lib/crm/insights'
import StatusBadge from '../../../../../../components/admin/StatusBadge'
import { INSIGHT_STATUS_LABELS, INSIGHT_CONTENT_TYPE_LABELS } from '../../../../../../types/db'

export const metadata = { title: 'Preview | Admissions CRM', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function InsightPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff()
  const { id } = await params
  const insight = await getInsightById(id)
  if (!insight) notFound()

  return (
    <div className="grid gap-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <Link href={`/admin/insights/${insight.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-navy-700)' }}>
          <ArrowLeft size={14} aria-hidden="true" /> Back to editor
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={insight.status} label={INSIGHT_STATUS_LABELS[insight.status]} />
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Staff preview — not visible to the public</span>
        </div>
      </div>

      <article className="card p-6 sm:p-10">
        {insight.featured_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={insight.featured_image} alt="" className="w-full rounded-xl object-cover mb-6" style={{ aspectRatio: '16 / 9' }} />
        )}
        <p className="eyebrow">{insight.category} · {INSIGHT_CONTENT_TYPE_LABELS[insight.content_type]}</p>
        <h1 className="h-display mt-2">{insight.title}</h1>
        {insight.short_description && (
          <p className="mt-3 text-[1.05rem] leading-relaxed" style={{ color: 'var(--color-body)' }}>{insight.short_description}</p>
        )}

        {insight.content_type === 'event' && insight.event_start_at && (
          <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--color-navy-50)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
              {new Date(insight.event_start_at).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}
              {insight.event_end_at && ` — ${new Date(insight.event_end_at).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}`}
            </p>
            {insight.event_venue && <p className="text-sm mt-1" style={{ color: 'var(--color-body)' }}>{insight.event_venue}</p>}
            {insight.event_contact && <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Contact: {insight.event_contact}</p>}
          </div>
        )}

        <div className="insight-content mt-8" dangerouslySetInnerHTML={{ __html: insight.content }} />
      </article>
    </div>
  )
}
