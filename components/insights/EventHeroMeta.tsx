import { CalendarDays, CalendarPlus, Clock3, MapPin, Ticket } from 'lucide-react'
import type { PublicInsight } from '../../lib/insights-public'
import { eventParts, eventStatus, googleCalendarUrl, timeRange } from './event-utils'
import styles from './events.module.css'

/** Date / time / venue chips and primary actions shown inside the event hero. */
export default function EventHeroMeta({ event, url, summary }: { event: PublicInsight; url: string; summary: string }) {
  const start = event.event_start_at
  const status = eventStatus(start, event.event_end_at)
  const ended = status?.key === 'ended'
  return (
    <>
      <div className={styles.heroChips}>
        {status && status.key !== 'upcoming' && (
          <span className={styles.heroChip} data-tone={status.key}>
            {status.key === 'live' && <span className={styles.pulse} aria-hidden="true" />}
            {status.label}
          </span>
        )}
        {start && <span className={styles.heroChip}><CalendarDays size={16} aria-hidden="true" />{eventParts(start).dateLong}</span>}
        {start && <span className={styles.heroChip}><Clock3 size={16} aria-hidden="true" />{timeRange(start, event.event_end_at)} WAT</span>}
        {event.event_venue && <span className={styles.heroChip}><MapPin size={16} aria-hidden="true" />{event.event_venue}</span>}
      </div>
      {!ended && (event.event_registration_url || start) && (
        <div className={styles.heroActions}>
          {event.event_registration_url && (
            <a href={event.event_registration_url} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnHero}`}>
              <Ticket size={18} aria-hidden="true" /> Register now
            </a>
          )}
          {start && (
            <a href={googleCalendarUrl({ title: event.title, start, end: event.event_end_at, venue: event.event_venue, description: summary, url })} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnOnDark} ${styles.btnHero}`}>
              <CalendarPlus size={18} aria-hidden="true" /> Add to calendar
            </a>
          )}
        </div>
      )}
    </>
  )
}
