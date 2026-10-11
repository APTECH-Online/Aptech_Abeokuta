import Link from 'next/link'
import { ArrowRight, CalendarDays } from 'lucide-react'
import Container from '../ui/Container'
import SectionHeading from '../ui/SectionHeading'
import ContentCard from '../insights/ContentCard'
import FeaturedCard from '../insights/FeaturedCard'
import EventRow from '../insights/EventRow'
import { getHomepageUpdates } from '../../lib/insights-public'

export default async function LatestUpdates() {
  const { featured, supporting, upcomingEvents } = await getHomepageUpdates()

  // Keep a compact events discovery panel even when the editorial feed is empty.
  const showEventsPanel = true

  return (
    <section className="section" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Latest News & Updates"
            title="What's happening at APTECH Abeokuta"
            description="Stay connected with the latest news, upcoming events, student achievements, and important announcements from APTECH Abeokuta."
          />
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link href="/insights" className="btn btn-secondary">
              View All News &amp; Insights
            </Link>
          </div>
        </div>

        <div className={`mt-10 grid grid-cols-1 gap-6 ${showEventsPanel && (featured || supporting.length > 0) ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
          {(featured || supporting.length > 0) && <div className={showEventsPanel ? 'lg:col-span-2 flex flex-col gap-6' : 'flex flex-col gap-6'}>
            {featured && <FeaturedCard post={featured} />}

            {supporting.length > 0 && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${showEventsPanel ? '' : 'lg:grid-cols-3'}`}>
                {supporting.slice(0, showEventsPanel ? 2 : 3).map((post) => (
                  <ContentCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </div>}

          {showEventsPanel && (
            <div className="card p-6 flex flex-col h-fit">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} aria-hidden="true" style={{ color: 'var(--color-teal-700)' }} />
                <p className="eyebrow">Upcoming events</p>
              </div>
              {upcomingEvents.length > 0 ? (
                <>
                  <div className="mt-1">
                    {upcomingEvents.map((event) => (
                      <EventRow key={event.slug} event={event} />
                    ))}
                  </div>
                  <Link
                    href="/events"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: 'var(--color-teal-700)' }}
                  >
                    View all events <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <div className="mt-3">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>New workshops, open days and tech activities will be announced here. Explore our programmes while you wait.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/events" className="text-sm font-semibold inline-flex items-center gap-1.5" style={{ color: 'var(--color-teal-700)' }}>Explore events <ArrowRight size={14} aria-hidden="true" /></Link>
                    <Link href="/courses" className="text-sm font-semibold">Browse courses</Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
