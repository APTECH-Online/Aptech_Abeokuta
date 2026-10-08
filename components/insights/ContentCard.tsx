import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarDays, GraduationCap, Lightbulb, MapPin, Monitor, ShieldCheck, Sparkles } from 'lucide-react'
import type { PublicInsight } from '../../lib/insights-public'
import { badgeLabel, formatPublishedDate, formatEventDate } from './badge'

function categoryTone(category?: string | null) {
  const value = (category || '').toLowerCase()
  if (value.includes('career')) return 'purple'
  if (value.includes('student') || value.includes('guide')) return 'teal'
  if (value.includes('tip') || value.includes('how')) return 'amber'
  if (value.includes('digital') || value.includes('skill')) return 'cyan'
  if (value.includes('technology') || value.includes('tech')) return 'blue'
  return 'blue'
}

function CategoryIcon({ category }: { category?: string | null }) {
  const value = (category || '').toLowerCase()
  if (value.includes('student') || value.includes('guide')) return <GraduationCap size={14} strokeWidth={2.2} aria-hidden="true" />
  if (value.includes('career')) return <Sparkles size={14} strokeWidth={2.2} aria-hidden="true" />
  if (value.includes('tip') || value.includes('how')) return <Lightbulb size={14} strokeWidth={2.2} aria-hidden="true" />
  if (value.includes('digital') || value.includes('skill')) return <Monitor size={14} strokeWidth={2.2} aria-hidden="true" />
  if (value.includes('cyber') || value.includes('security')) return <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" />
  return <Sparkles size={14} strokeWidth={2.2} aria-hidden="true" />
}

export default function ContentCard({ post }: { post: PublicInsight }) {
  const isEvent = post.content_type === 'event'
  const dateLabel = isEvent ? formatEventDate(post.event_start_at) : formatPublishedDate(post.publish_at)
  const tone = categoryTone(post.category)
  const categoryLabel = post.category || badgeLabel(post.content_type, post.category)

  return (
    <article className={`editorial-card editorial-card--${tone} group`}>
      <Link href={`/insights/${post.slug}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy-600)] focus-visible:ring-offset-2 rounded-[inherit]">
        <div className="editorial-card__media relative">
          {post.featured_image ? (
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
              className="object-cover editorial-image"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 editorial-image-fallback pattern-adire" aria-hidden="true">
              <span className="font-display font-semibold text-xs tracking-[0.12em] text-white/70">APTECH ABEOKUTA</span>
            </div>
          )}
          <div className="editorial-card__media-overlay" aria-hidden="true" />
          <span className="editorial-card__category editorial-card__category--overlay">
            <CategoryIcon category={post.category} />
            <span>{categoryLabel}</span>
          </span>
        </div>

        <div className="editorial-card__body">
          <p className="editorial-card__category-label">
            <span className="editorial-card__category-mark" aria-hidden="true"><CategoryIcon category={post.category} /></span>
            {categoryLabel}
          </p>
          <h3 className="editorial-card__title">{post.title}</h3>
          {dateLabel && (
            <p className="editorial-meta">
              <CalendarDays size={14} aria-hidden="true" />
              {dateLabel}
            </p>
          )}
          {isEvent && post.event_venue && (
            <p className="editorial-meta mt-1">
              <MapPin size={14} aria-hidden="true" />
              {post.event_venue}
            </p>
          )}
          {post.short_description && <p className="editorial-card__excerpt">{post.short_description}</p>}
          <span className="editorial-readmore">
            {isEvent ? 'View event details' : 'Read more'} <ArrowRight size={15} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  )
}
