import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarDays, Clock3, MapPin, Ticket } from 'lucide-react'
import type { PublicInsight } from '../../lib/insights-public'
import { eventParts, eventStatus, timeRange } from './event-utils'
import styles from './events.module.css'

/**
 * Card for an upcoming event: calendar tile + status chip over the cover
 * (or a branded fallback), then title, summary and the facts a visitor needs
 * to decide — day, time (WAT) and venue. The whole card is one link.
 */
export default function UpcomingEventCard({ event, priority = false }: { event: PublicInsight; priority?: boolean }) {
  const start = event.event_start_at
  const parts = start ? eventParts(start) : null
  const status = eventStatus(start, event.event_end_at)
  const registrationOpen = Boolean(event.event_registration_url) && status?.key !== 'ended'

  return (
    <div className={styles.cardWrap}>
      <Link href={`/insights/${event.slug}`} className={styles.card}>
        <div className={styles.media}>
          {event.featured_image ? (
            <Image
              src={event.featured_image}
              alt=""
              fill
              sizes="(max-width: 699px) 100vw, (max-width: 1023px) 50vw, 33vw"
              className={styles.mediaImg}
              priority={priority}
            />
          ) : (
            <div className={styles.mediaFallback} aria-hidden="true"><CalendarDays size={72} strokeWidth={1.25} /></div>
          )}
          <div className={styles.mediaShade} aria-hidden="true" />
          {parts && (
            <div className={styles.dateTile} aria-hidden="true">
              <span className={styles.dateWeekday}>{parts.weekday}</span>
              <span className={styles.dateDay}>{parts.day}</span>
              <span className={styles.dateMonth}>{parts.month}</span>
            </div>
          )}
          {status && status.key !== 'upcoming' && (
            <span className={styles.status} data-tone={status.key}>
              {status.key === 'live' && <span className={styles.pulse} aria-hidden="true" />}
              {status.label}
            </span>
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.kicker}>
            <span className={styles.tag}>Event</span>
            {registrationOpen && <span className={`${styles.tag} ${styles.tagOpen}`}><Ticket size={12} aria-hidden="true" /> Registration open</span>}
          </div>
          <h3 className={styles.title}>{event.title}</h3>
          {event.short_description && <p className={styles.excerpt}>{event.short_description}</p>}

          <ul className={styles.meta}>
            {start && parts && (
              <li className={styles.metaRow}>
                <CalendarDays size={16} aria-hidden="true" />
                <span><time dateTime={start}>{parts.dateLong}</time></span>
              </li>
            )}
            {start && (
              <li className={styles.metaRow}>
                <Clock3 size={16} aria-hidden="true" />
                <span>{timeRange(start, event.event_end_at)} WAT</span>
              </li>
            )}
            {event.event_venue && (
              <li className={styles.metaRow}>
                <MapPin size={16} aria-hidden="true" />
                <span>{event.event_venue}</span>
              </li>
            )}
          </ul>

          <span className={styles.cta}>View event details <ArrowRight size={16} aria-hidden="true" /></span>
        </div>
      </Link>
    </div>
  )
}
