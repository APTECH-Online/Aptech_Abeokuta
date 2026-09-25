import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarDays } from 'lucide-react'
import type { PublicInsight } from '../../lib/insights-public'
import { badgeLabel, badgeColors, formatPublishedDate } from './badge'

export default function FeaturedCard({ post }: { post: PublicInsight }) {
  const badge = badgeColors(post.content_type)
  const dateLabel = formatPublishedDate(post.publish_at)

  return (
    <Link
      href={`/insights/${post.slug}`}
      className="card overflow-hidden flex flex-col lg:flex-row group h-full"
    >
      <div
        className="relative w-full lg:w-1/2 shrink-0"
        style={{ aspectRatio: '16 / 10', background: 'var(--color-navy-50)' }}
      >
        {post.featured_image ? (
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pattern-adire" style={{ background: 'var(--color-navy-900)' }}>
            <span className="font-display font-semibold text-sm tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
              APTECH ABEOKUTA
            </span>
          </div>
        )}
        <span
          className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
          style={{ background: badge.bg, color: badge.fg }}
        >
          {badgeLabel(post.content_type)}
        </span>
      </div>

      <div className="p-7 sm:p-8 flex flex-col justify-center flex-1">
        <p className="eyebrow">Featured · {post.category}</p>
        <h3 className="mt-3 font-display font-semibold text-[1.4rem] sm:text-[1.6rem] leading-snug text-[var(--color-ink)]">
          {post.title}
        </h3>
        {dateLabel && (
          <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
            <CalendarDays size={13} aria-hidden="true" />
            {dateLabel}
          </p>
        )}
        {post.short_description && (
          <p className="mt-3 text-[0.95rem] leading-relaxed" style={{ color: 'var(--color-body)' }}>
            {post.short_description}
          </p>
        )}
        <span
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold w-fit"
          style={{ color: 'var(--color-teal-700)' }}
        >
          Read the full story
          <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
