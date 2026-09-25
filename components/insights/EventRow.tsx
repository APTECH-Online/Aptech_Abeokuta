import Link from 'next/link'
import { CalendarDays, MapPin, ArrowRight } from 'lucide-react'
import type { PublicInsight } from '../../lib/insights-public'
import { formatEventDate } from './badge'

export default function EventRow({ event }: { event: PublicInsight }) {
  const day = event.event_start_at ? new Date(event.event_start_at).getDate() : null
  const month = event.event_start_at
    ? new Date(event.event_start_at).toLocaleDateString('en-GB', { month: 'short' })
    : null

  return (
    <Link
      href={`/insights/${event.slug}`}
      className="flex items-start gap-4 py-4 group"
      style={{ borderBottom: '1px solid var(--color-line)' }}
    >
      <div
        className="shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center"
        style={{ background: 'var(--color-teal-50)', border: '1px solid var(--color-teal-100)' }}
      >
        <span className="font-display font-bold text-base leading-none" style={{ color: 'var(--color-teal-700)' }}>
          {day ?? '—'}
        </span>
        <span className="text-[0.65rem] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'var(--color-teal-700)' }}>
          {month ?? ''}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-sm text-[var(--color-ink)] leading-snug group-hover:underline">
          {event.title}
        </h4>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--color-muted)' }}>
          {event.event_start_at && (
            <span className="flex items-center gap-1">
              <CalendarDays size={12} aria-hidden="true" />
              {formatEventDate(event.event_start_at)}
            </span>
          )}
          {event.event_venue && (
            <span className="flex items-center gap-1">
              <MapPin size={12} aria-hidden="true" />
              {event.event_venue}
            </span>
          )}
        </div>
      </div>
      <ArrowRight size={16} aria-hidden="true" className="shrink-0 mt-1" style={{ color: 'var(--color-teal-700)' }} />
    </Link>
  )
}
