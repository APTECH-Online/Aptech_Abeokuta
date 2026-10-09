import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import ContentTypeListing from '../../../components/insights/ContentTypeListing'
import UpcomingEventCard from '../../../components/insights/UpcomingEventCard'
import eventStyles from '../../../components/insights/events.module.css'
import { getPublishedInsights, getUpcomingEvents, getInsightCategories } from '../../../lib/insights-public'
import { breadcrumbJsonLd } from '../../../lib/structured-data'
import { buildMetadata, getSiteUrl } from '../../../lib/seo'
import JsonLd from '../../../components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'News, Events & Career Guidance | APTECH Abeokuta',
  description:
    'Latest news, announcements, events and career guidance from APTECH Abeokuta, an IT training centre in Abeokuta, Ogun State.',
  path: '/insights'
})

type Props = { searchParams: Promise<{ category?: string }> }

export default async function InsightsPage({ searchParams }: Props) {
  const { category } = await searchParams
  const baseUrl = getSiteUrl()

  const [categories, upcomingEvents] = await Promise.all([getInsightCategories(), getUpcomingEvents(3)])

  const activeCategory = category && categories.includes(category) ? category : undefined
  const posts = await getPublishedInsights({ category: activeCategory })

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Insights' }])} />
      <PageHero
        eyebrow="Insights"
        title="News, events & career guidance"
        description="What's happening at APTECH Abeokuta — announcements, upcoming events, and practical guidance for deciding your next step."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Insights' }]}
      />

      {upcomingEvents.length > 0 && (
        <section className="section-tight editorial-upcoming" aria-labelledby="upcoming-events-heading" style={{ background: 'var(--color-paper-alt)', borderBottom: '1px solid var(--color-line)' }}>
          <Container>
            <div className={eventStyles.sectionHead}>
              <div>
                <p className="eyebrow">Upcoming events</p>
                <h2 id="upcoming-events-heading" className={eventStyles.sectionTitle}>Come and meet us</h2>
              </div>
              <Link href="/insights/events" className={eventStyles.viewAll}>
                View all events <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className={eventStyles.grid} data-count={upcomingEvents.length}>
              {upcomingEvents.map((event, i) => (
                <UpcomingEventCard key={event.slug} event={event} priority={i === 0} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <ContentTypeListing
        active="/insights"
        eyebrow="Updates"
        categories={categories}
        activeCategory={activeCategory}
        categoryBaseHref="/insights"
        posts={posts}
        emptyMessage="No articles in this category yet — check back soon."
      />
    </>
  )
}
