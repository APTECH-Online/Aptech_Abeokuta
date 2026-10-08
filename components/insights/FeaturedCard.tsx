import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarDays, GraduationCap, Lightbulb, Monitor, ShieldCheck, Sparkles, Star } from 'lucide-react'
import type { PublicInsight } from '../../lib/insights-public'
import { badgeLabel, formatPublishedDate } from './badge'

function CategoryIcon({ category }: { category?: string | null }) {
  const value = (category || '').toLowerCase()
  if (value.includes('student') || value.includes('guide')) return <GraduationCap size={16} strokeWidth={2.2} aria-hidden="true" />
  if (value.includes('tip') || value.includes('how')) return <Lightbulb size={16} strokeWidth={2.2} aria-hidden="true" />
  if (value.includes('digital') || value.includes('skill')) return <Monitor size={16} strokeWidth={2.2} aria-hidden="true" />
  if (value.includes('cyber') || value.includes('security')) return <ShieldCheck size={16} strokeWidth={2.2} aria-hidden="true" />
  return <Sparkles size={16} strokeWidth={2.2} aria-hidden="true" />
}

export default function FeaturedCard({ post }: { post: PublicInsight }) {
  const dateLabel = formatPublishedDate(post.publish_at)
  const categoryLabel = post.category || badgeLabel(post.content_type, post.category)

  return (
    <article className="editorial-featured overflow-hidden group">
      <Link href={`/insights/${post.slug}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-navy-600)] focus-visible:ring-offset-2 rounded-[inherit]">
        <div className="grid lg:grid-cols-2 h-full">
          <div className="editorial-featured__media relative">
            {post.featured_image ? (
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-cover editorial-image"
                priority
              />
            ) : (
              <div className="absolute inset-0 editorial-image-fallback pattern-adire" aria-hidden="true">
                <span className="font-display font-semibold text-sm tracking-[0.12em] text-white/70">APTECH ABEOKUTA</span>
              </div>
            )}
            <div className="editorial-featured__media-overlay" aria-hidden="true" />
            <span className="editorial-featured__badge"><Star size={13} fill="currentColor" aria-hidden="true" /> FEATURED</span>
          </div>

          <div className="editorial-featured__content">
            <p className="editorial-category">
              <span className="editorial-category__diamond" aria-hidden="true" />
              <span>FEATURED</span>
              <span className="editorial-category__dot" aria-hidden="true">•</span>
              <span className="editorial-category__tag"><CategoryIcon category={post.category} /> {categoryLabel}</span>
            </p>
            <h2 className="editorial-featured__title">{post.title}</h2>
            {dateLabel && (
              <p className="editorial-meta">
                <CalendarDays size={15} aria-hidden="true" />
                {dateLabel}
              </p>
            )}
            {post.short_description && <p className="editorial-featured__excerpt">{post.short_description}</p>}
            <span className="editorial-readmore editorial-readmore--featured">
              Read the full story <ArrowRight size={17} aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
