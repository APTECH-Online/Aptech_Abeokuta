import Link from 'next/link'
import PageHero from '../../../components/shared/PageHero'
import Container from '../../../components/ui/Container'
import SectionHeading from '../../../components/ui/SectionHeading'
import EventCard from '../../../components/events/EventCard'
import EventRegistrationForm from '../../../components/events/EventRegistrationForm'
import EventsAside from '../../../components/events/EventsAside'
import { GoodToKnow, WhatYouCanAttend } from '../../../components/events/EventsInfo'
import type { CampusEvent } from '../../../components/events/event-meta'
import { createAdminClient } from '../../../lib/supabase/admin'
import { getPublicContactInfo } from '../../../lib/contact-info-public'
import { buildMetadata } from '../../../lib/seo'
import '../../../components/events/events-page.css'

export const metadata = buildMetadata({
  title: 'Free Workshops, Webinars & Campus Events | APTECH Abeokuta',
  description: 'Register for introductory coding workshops, technology career talks, demonstrations and campus open days at APTECH Abeokuta.',
  path: '/events'
})
export const dynamic = 'force-dynamic'

/** Cards shown above the form; every open event stays selectable in the form itself. */
const MAX_CARDS = 9

const EVENT_COLUMNS = 'id,title,slug,event_type,description,starts_at,ends_at,location,delivery_mode,capacity'

/**
 * Upcoming events open for registration. If the richer query fails (for example a
 * database that hasn't had every column migrated), fall back to the three columns
 * the form strictly needs so the page still works.
 */
async function getUpcomingEvents(): Promise<CampusEvent[]> {
  try {
    const db = createAdminClient()
    const now = new Date().toISOString()
    const query = (columns: string) =>
      db.from('campus_events').select(columns).eq('registration_open', true).gte('starts_at', now).order('starts_at').limit(50)

    const full = await query(EVENT_COLUMNS)
    if (!full.error) return (full.data ?? []) as unknown as CampusEvent[]

    const basic = await query('id,title,starts_at')
    return ((basic.data ?? []) as unknown as Pick<CampusEvent, 'id' | 'title' | 'starts_at'>[]).map((e) => ({
      ...e, slug: null, event_type: null, description: null, ends_at: null, location: null, delivery_mode: null, capacity: null
    }))
  } catch {
    return []
  }
}

export default async function EventsRegistrationPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [events, params, contact] = await Promise.all([getUpcomingEvents(), searchParams, getPublicContactInfo()])
  const { whatsapp, email } = contact

  // /events?event=<id or slug> opens the page with that session already chosen (handy for shared links).
  const wanted = typeof params.event === 'string' ? params.event : ''
  const initialEventId = events.find((e) => e.id === wanted || (e.slug && e.slug === wanted))?.id ?? ''

  const cards = events.slice(0, MAX_CARDS)
  // The form only needs enough to label options and show the chosen session.
  const formEvents = events.map(({ id, title, starts_at, ends_at, location, delivery_mode }) => ({ id, title, starts_at, ends_at, location, delivery_mode }))

  return (
    <>
      <PageHero
        eyebrow="Learn, explore, connect"
        title="Free workshops, webinars & campus events"
        description="Try a coding session, explore technology careers, see a live demonstration or meet our team at an open day."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Events' }]}
      >
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="#upcoming" className="btn btn-accent">See upcoming events</Link>
          <Link href="#register" className="btn btn-secondary btn-secondary-on-dark">Register now</Link>
        </div>
      </PageHero>

      <section id="upcoming" className="section ev-anchor">
        <Container>
          <SectionHeading
            eyebrow="Your next step into tech"
            title="Upcoming sessions"
            description="Experience learning before you choose a programme. Pick a session to start your registration."
          />
          {cards.length > 0 ? (
            <>
              <div className="ev-grid" data-count={cards.length}>
                {cards.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
              {events.length > cards.length && (
                <p className="ev-more">Showing the next {cards.length} sessions. All {events.length} open events are listed in the registration form below.</p>
              )}
            </>
          ) : (
            <div className="ev-empty">
              <p className="ev-empty__title">No sessions are open for registration right now</p>
              <p className="ev-empty__text">We add new workshops, webinars and open days regularly. Check back soon, or talk to our team and we&apos;ll tell you what&apos;s coming up.</p>
              <div className="ev-empty__actions">
                <Link href="/contact" className="btn btn-primary">Contact our team</Link>
                <Link href="/courses" className="btn btn-secondary">Browse courses</Link>
              </div>
            </div>
          )}
        </Container>
      </section>

      <section className="section-tight" style={{ background: 'var(--color-paper-alt)', borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}>
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
            <div className="flex flex-col">
              <SectionHeading eyebrow="What's on" title="What you can attend" />
              <div className="mt-6 flex-1 flex flex-col"><WhatYouCanAttend /></div>
            </div>
            <div className="flex flex-col">
              <SectionHeading eyebrow="Good to know" title="Before you register" />
              <div className="mt-6 flex-1 flex flex-col"><GoodToKnow /></div>
            </div>
          </div>
        </Container>
      </section>

      <section id="register" className="section ev-anchor">
        <Container className="max-w-5xl">
          <div className="apply-layout">
            <EventsAside whatsapp={whatsapp} email={email} />
            <div className="min-w-0">
              <EventRegistrationForm events={formEvents} whatsapp={whatsapp} initialEventId={initialEventId} />
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
