import Link from 'next/link'
import { Tag } from 'lucide-react'

/**
 * Category filter: small outlined chips under a "Topic" label. Links (not
 * buttons) so each filtered view is a shareable URL; the active chip carries
 * aria-current.
 */
export default function InsightsTopics({
  categories,
  activeCategory,
  baseHref
}: {
  categories: string[]
  activeCategory?: string
  baseHref: string
}) {
  return (
    <div className="ins-topics" role="group" aria-label="Filter by topic">
      <p className="ins-topics__label">
        <Tag size={14} aria-hidden="true" />
        Topic
      </p>
      <div className="ins-topics__list">
        <Link href={baseHref} className="ins-topic" aria-current={!activeCategory ? 'true' : undefined}>
          All topics
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`${baseHref}?category=${encodeURIComponent(c)}`}
            className="ins-topic"
            aria-current={activeCategory === c ? 'true' : undefined}
          >
            {c}
          </Link>
        ))}
      </div>
    </div>
  )
}
