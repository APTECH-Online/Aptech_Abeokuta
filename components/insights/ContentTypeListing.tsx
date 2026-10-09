import Container from '../ui/Container'
import InsightsSubNav from './InsightsSubNav'
import InsightsTopics from './InsightsTopics'
import FeaturedCard from './FeaturedCard'
import ContentCard from './ContentCard'
import type { PublicInsight } from '../../lib/insights-public'

type Props = {
  active: string
  eyebrow: string
  categories: string[]
  activeCategory?: string
  categoryBaseHref: string
  posts: PublicInsight[]
  emptyMessage: string
}

/**
 * Shared editorial listing used by /insights/news, /insights/blog and
 * /insights/announcements: sub-nav across the top, category chips, a
 * featured lead story, then a responsive grid of the rest. Keeps all three
 * content-type pages visually consistent with each other and with the
 * homepage "Latest News & Updates" section (which reuses the same card
 * components).
 */
export default function ContentTypeListing({
  active,
  categories,
  activeCategory,
  categoryBaseHref,
  posts,
  emptyMessage
}: Props) {
  const [featured, ...rest] = posts

  return (
    <section className="section editorial-listing">
      <Container>
        <InsightsSubNav active={active} />

        {categories.length > 0 && (
          <InsightsTopics categories={categories} activeCategory={activeCategory} baseHref={categoryBaseHref} />
        )}

        {posts.length === 0 ? (
          <p className="mt-10 text-sm" style={{ color: 'var(--color-muted)' }}>
            {emptyMessage}
          </p>
        ) : (
          <div className="mt-10 flex flex-col gap-12">
            {featured && <FeaturedCard post={featured} />}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post) => (
                  <ContentCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </div>
        )}
      </Container>
    </section>
  )
}
