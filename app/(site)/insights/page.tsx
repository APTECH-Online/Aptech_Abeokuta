import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import { getPublishedInsights, getUpcomingEvents, getInsightCategories } from '../../../lib/insights-public'
import { breadcrumbJsonLd } from '../../../lib/structured-data'
import { INSIGHT_CONTENT_TYPE_LABELS } from '../../../types/db'

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

type Props = { searchParams: Promise<{ category?: string; view?: string }> }

export default async function InsightsPage({ searchParams }: Props) {
  const { category, view } = await searchParams
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  const showEventsOnly = view === 'events'

  const [categories, upcomingEvents] = await Promise.all([
    getInsightCategories(),
    getUpcomingEvents(showEventsOnly ? 50 : 3)
  ])

  const activeCategory = category && categories.includes(category) ? category : undefined
  const posts = showEventsOnly ? [] : await getPublishedInsights({ category: activeCategory })

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

      {!showEventsOnly && upcomingEvents.length > 0 && (
        <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderBottom: '1px solid var(--color-line)' }}>
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <p className="eyebrow">Upcoming events</p>
              <Link href="/insights?view=events" className="text-sm font-semibold" style={{ color: 'var(--color-teal-700)' }}>
                View all events →
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.slug}
                  href={`/insights/${event.slug}`}
                  className="card p-5 flex flex-col"
                >
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

      <section className="section">
        <Container>
          {showEventsOnly ? (
            <div className="flex flex-wrap items-end justify-between gap-4">
              <p className="eyebrow">All upcoming events</p>
              <Link href="/insights" className="text-sm font-semibold" style={{ color: 'var(--color-teal-700)' }}>
                ← Back to Insights
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
              <Link
                href="/insights"
                className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors"
                style={{
                  background: !activeCategory ? 'var(--color-navy-900)' : 'var(--color-navy-50)',
                  color: !activeCategory ? '#fff' : 'var(--color-navy-900)'
                }}
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={`/insights?category=${encodeURIComponent(c)}`}
                  className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors"
                  style={{
                    background: activeCategory === c ? 'var(--color-navy-900)' : 'var(--color-navy-50)',
                    color: activeCategory === c ? '#fff' : 'var(--color-navy-900)'
                  }}
                >
                  {c}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showEventsOnly ? upcomingEvents : posts).map((post) => (
              <article key={post.slug} className="card p-6 flex flex-col">
                <p className="eyebrow">{post.category} · {INSIGHT_CONTENT_TYPE_LABELS[post.content_type]}</p>
                <h2 className="mt-3 font-display font-semibold text-[1.05rem] text-[var(--color-ink)] leading-snug">
                  {post.title}
                </h2>
                {post.short_description && (
                  <p className="mt-2.5 text-sm leading-relaxed flex-1" style={{ color: 'var(--color-body)' }}>
                    {post.short_description}
                  </p>
                )}
                {post.content_type === 'event' && post.event_start_at && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                    <CalendarDays size={13} aria-hidden="true" />
                    {new Date(post.event_start_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
                <Link
                  href={`/insights/${post.slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: 'var(--color-teal-700)' }}
                >
                  {post.content_type === 'event' ? 'View event' : 'Read article'}
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>

          {(showEventsOnly ? upcomingEvents : posts).length === 0 && (
            <p className="mt-10 text-sm" style={{ color: 'var(--color-muted)' }}>
              {showEventsOnly ? 'No upcoming events right now — check back soon.' : 'No articles in this category yet — check back soon.'}
            </p>
          )}
        </Container>
      </section>
    </>
  )
}
