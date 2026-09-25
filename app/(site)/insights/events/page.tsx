import PageHero from '../../../../components/shared/PageHero'
import Container from '../../../../components/ui/Container'
import InsightsSubNav from '../../../../components/insights/InsightsSubNav'
import ContentCard from '../../../../components/insights/ContentCard'
import EventRow from '../../../../components/insights/EventRow'
import { getUpcomingEvents, getPastEvents } from '../../../../lib/insights-public'
import { breadcrumbJsonLd } from '../../../../lib/structured-data'

export const metadata = {
  title: 'Events',
  description: 'Upcoming and past events at APTECH Abeokuta.',
  alternates: { canonical: '/insights/events' },
  openGraph: {
    title: 'Events — APTECH Abeokuta',
    description: 'Upcoming and past events at APTECH Abeokuta.',
    url: '/insights/events'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Events — APTECH Abeokuta',
    description: 'Upcoming and past events at APTECH Abeokuta.'
  }
}

export default async function EventsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  const [upcoming, past] = await Promise.all([getUpcomingEvents(50), getPastEvents(20)])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'Events' }])
          )
        }}
      />
      <PageHero
        eyebrow="Events"
        title="Events at APTECH Abeokuta"
        description="Open days, orientation sessions, tech talks, and other events — upcoming and past."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'Events' }]}
      />

      <section className="section">
        <Container>
          <InsightsSubNav active="/insights/events" />

          <div className="mt-10">
            <p className="eyebrow">Upcoming events</p>
            {upcoming.length === 0 ? (
              <p className="mt-4 text-sm" style={{ color: 'var(--color-muted)' }}>
                No upcoming events right now — check back soon, or browse our recent news and announcements.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map((event) => (
                  <ContentCard key={event.slug} post={event} />
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div className="mt-16">
              <p className="eyebrow">Past events</p>
              <div className="mt-2 card p-6">
                {past.map((event) => (
                  <EventRow key={event.slug} event={event} />
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
