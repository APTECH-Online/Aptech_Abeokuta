import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import type { PublicInsight } from '../../lib/insights-public'
import { badgeLabel, badgeColors, formatPublishedDate, formatEventDate } from './badge'

export default function ContentCard({ post }: { post: PublicInsight }) {
  const isEvent = post.content_type === 'event'
  const badge = badgeColors(post.content_type)
  const dateLabel = isEvent ? formatEventDate(post.event_start_at) : formatPublishedDate(post.publish_at)

  return (
    <article className="card overflow-hidden flex flex-col h-full">
      <div
        className="relative w-full"
        style={{ aspectRatio: '16 / 9', background: 'var(--color-navy-50)' }}
      >
        {post.featured_image ? (
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center pattern-adire"
            style={{ background: 'var(--color-navy-900)' }}
          >
            <span className="font-display font-semibold text-xs tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
              APTECH ABEOKUTA
            </span>
          </div>
        )}
        <span
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[0.68rem] font-bold tracking-wide"
          style={{ background: badge.bg, color: badge.fg }}
        >
          {badgeLabel(post.content_type)}
        </span>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <p className="eyebrow">{post.category}</p>
        <h3 className="mt-2.5 font-display font-semibold text-[1.05rem] text-[var(--color-ink)] leading-snug">
          {post.title}
        </h3>

        {dateLabel && (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
            <CalendarDays size={13} aria-hidden="true" />
            {dateLabel}
          </p>
        )}
        {isEvent && post.event_venue && (
          <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
            <MapPin size={13} aria-hidden="true" />
            {post.event_venue}
          </p>
        )}

        {post.short_description && (
          <p className="mt-2.5 text-sm leading-relaxed flex-1" style={{ color: 'var(--color-body)' }}>
            {post.short_description}
          </p>
        )}

        <Link
          href={`/insights/${post.slug}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: 'var(--color-teal-700)' }}
        >
          {isEvent ? 'View event details' : 'Read more'}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
