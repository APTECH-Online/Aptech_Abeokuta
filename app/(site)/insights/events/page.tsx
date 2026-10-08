import PageHero from '../../../../components/shared/PageHero'
import Container from '../../../../components/ui/Container'
import InsightsSubNav from '../../../../components/insights/InsightsSubNav'
import ContentCard from '../../../../components/insights/ContentCard'
import EventRow from '../../../../components/insights/EventRow'
import { getUpcomingEvents, getPastEvents } from '../../../../lib/insights-public'
import { breadcrumbJsonLd } from '../../../../lib/structured-data'
import { buildMetadata, getSiteUrl } from '../../../../lib/seo'
import JsonLd from '../../../../components/shared/JsonLd'

export const metadata = buildMetadata({
  title: 'Events | APTECH Abeokuta',
  description:
    'Upcoming and past events at APTECH Abeokuta, with registration and contact details where available.',
  path: '/insights/events'
})

export default async function EventsPage() {
  const baseUrl = getSiteUrl()
  const [upcoming, past] = await Promise.all([getUpcomingEvents(50), getPastEvents(20)])

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(baseUrl, [{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'Events' }])} />
      <PageHero
        eyebrow="Events"
        title="Events at APTECH Abeokuta"
        description="Open days, orientation sessions, tech talks, and other events — upcoming and past."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Insights', href: '/insights' }, { label: 'Events' }]}
      />

      <section className="section editorial-events-page">
        <Container>
          <InsightsSubNav active="/insights/events" />

          <div className="editorial-events-block mt-10">
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
            <div className="editorial-events-block mt-16">
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
