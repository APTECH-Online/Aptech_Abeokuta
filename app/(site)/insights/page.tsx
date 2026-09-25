import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import ContentTypeListing from '../../../components/insights/ContentTypeListing'
import { getPublishedInsights, getUpcomingEvents, getInsightCategories } from '../../../lib/insights-public'
import { breadcrumbJsonLd } from '../../../lib/structured-data'

export const metadata = {
  title: 'Insights',
  description: 'News, announcements, events and career guidance from APTECH Abeokuta.',
  alternates: { canonical: '/insights' },
  openGraph: {
    title: 'Insights — APTECH Abeokuta',
    description: 'News, announcements, events and career guidance from APTECH Abeokuta.',
    url: '/insights'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insights — APTECH Abeokuta',
    description: 'News, announcements, events and career guidance from APTECH Abeokuta.'
  }
}

type Props = { searchParams: Promise<{ category?: string }> }

export default async function InsightsPage({ searchParams }: Props) {
  const { category } = await searchParams
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

  const [categories, upcomingEvents] = await Promise.all([getInsightCategories(), getUpcomingEvents(3)])

  const activeCategory = category && categories.includes(category) ? category : undefined
  const posts = await getPublishedInsights({ category: activeCategory })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Insights' }]))
        }}
      />
      <PageHero
        eyebrow="Insights"
        title="News, events & career guidance"
        description="What's happening at APTECH Abeokuta — announcements, upcoming events, and practical guidance for deciding your next step."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Insights' }]}
      />

      {upcomingEvents.length > 0 && (
        <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderBottom: '1px solid var(--color-line)' }}>
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <p className="eyebrow">Upcoming events</p>
              <Link href="/insights/events" className="text-sm font-semibold" style={{ color: 'var(--color-teal-700)' }}>
                View all events →
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <Link key={event.slug} href={`/insights/${event.slug}`} className="card p-5 flex flex-col">
                  <p className="eyebrow">Event</p>
                  <h3 className="mt-2 font-display font-semibold text-sm text-[var(--color-ink)] leading-snug">{event.title}</h3>
                  {event.event_start_at && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                      <CalendarDays size={13} aria-hidden="true" />
                      {new Date(event.event_start_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {event.event_venue && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                      <MapPin size={13} aria-hidden="true" />
                      {event.event_venue}
                    </p>
                  )}
                </Link>
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
