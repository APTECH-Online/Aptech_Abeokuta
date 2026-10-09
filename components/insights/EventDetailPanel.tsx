import { AlertCircle, CalendarPlus, Clock3, ExternalLink, MapPin, MessageCircle, Navigation, Phone, Share2, Ticket, CalendarDays, Download } from 'lucide-react'
import Link from 'next/link'
import type { PublicInsight } from '../../lib/insights-public'
import { contactHref, eventParts, eventStatus, googleCalendarUrl, icsDataUri, mapsSearchUrl, sameLagosDay, timeRange } from './event-utils'
import styles from './events.module.css'

type Props = { event: PublicInsight; url: string; summary: string }

/** Sticky "at a glance" panel for the event detail page: when, where, register, add to calendar. */
export default function EventDetailPanel({ event, url, summary }: Props) {
  const start = event.event_start_at
  const end = event.event_end_at
  const parts = start ? eventParts(start) : null
  const status = eventStatus(start, end)
  const ended = status?.key === 'ended'
  const multiDay = Boolean(start && end && !sameLagosDay(start, end))
  const contactLink = event.event_contact ? contactHref(event.event_contact) : null
  const cal = start ? { title: event.title, start, end, venue: event.event_venue, description: summary, url } : null

  return (
    <aside id="event-details" className={styles.panel} aria-label="Event details">
      <div className={styles.panelHead}>
        {parts && (
          <div className={styles.panelDate} aria-hidden="true">
            <span className={styles.dateWeekday}>{parts.weekday}</span>
            <span className={styles.dateDay}>{parts.day}</span>
            <span className={styles.dateMonth}>{parts.month}</span>
          </div>
        )}
        <div className={styles.panelHeadText}>
          <p className={styles.panelKicker}>Event details</p>
          <p className={styles.panelWhen}>{start ? (multiDay && end ? `${parts!.dateShort} – ${eventParts(end).dateShort}` : timeRange(start, end) + ' WAT') : 'Date to be announced'}</p>
        </div>
      </div>

      <div className={styles.panelBody}>
        {start && parts && (
          <div className={styles.fact}>
            <span className={styles.factIcon}><CalendarDays size={18} aria-hidden="true" /></span>
            <div>
              <p className={styles.factLabel}>Date</p>
              <p className={styles.factValue}>
                <time dateTime={start}>{parts.dateLong}</time>
                {multiDay && end && <> <span aria-hidden="true">→</span> <time dateTime={end}>{eventParts(end).dateLong}</time></>}
              </p>
            </div>
          </div>
        )}
        {start && (
          <div className={styles.fact}>
            <span className={styles.factIcon}><Clock3 size={18} aria-hidden="true" /></span>
            <div>
              <p className={styles.factLabel}>Time</p>
              <p className={styles.factValue}>{multiDay && end ? `${timeRange(start)} – ${timeRange(end)}` : timeRange(start, end)} · West Africa Time</p>
            </div>
          </div>
        )}
        {event.event_venue && (
          <div className={styles.fact}>
            <span className={styles.factIcon}><MapPin size={18} aria-hidden="true" /></span>
            <div>
              <p className={styles.factLabel}>Venue</p>
              <p className={styles.factValue}>{event.event_venue}</p>
              <a href={mapsSearchUrl(event.event_venue)} target="_blank" rel="noopener noreferrer" className={styles.factLink}>
                <Navigation size={13} aria-hidden="true" /> Get directions
              </a>
            </div>
          </div>
        )}
        {event.event_contact && (
          <div className={styles.fact}>
            <span className={styles.factIcon}><Phone size={18} aria-hidden="true" /></span>
            <div>
              <p className={styles.factLabel}>Contact</p>
              <p className={styles.factValue}>{contactLink ? <a href={contactLink} className={styles.factLink} style={{ marginTop: 0, fontSize: '0.95rem' }}>{event.event_contact}</a> : event.event_contact}</p>
            </div>
          </div>
        )}

        <hr className={styles.panelDivider} />

        {ended ? (
          <div className={styles.endedNote}>
            <AlertCircle size={17} aria-hidden="true" />
            <span>This event has ended. Browse our other upcoming events or ask the admissions team what’s next.</span>
          </div>
        ) : event.event_registration_url ? (
          <a href={event.event_registration_url} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnPrimary}`}>
            <Ticket size={18} aria-hidden="true" /> Register for this event <ExternalLink size={15} aria-hidden="true" />
          </a>
        ) : (
          <Link href="/contact" className={`${styles.btn} ${styles.btnGhost}`}>Ask about this event</Link>
        )}

        {cal && !ended && (
          <div className={styles.calRow}>
            <p className={styles.calTitle}><CalendarPlus size={13} aria-hidden="true" style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />Add to calendar</p>
            <div className={styles.calBtns}>
              <a href={googleCalendarUrl(cal)} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnGhost}`}>Google</a>
              <a href={icsDataUri({ ...cal, uid: event.slug })} download={`${event.slug}.ics`} className={`${styles.btn} ${styles.btnGhost}`}><Download size={14} aria-hidden="true" /> Apple / Outlook</a>
            </div>
          </div>
        )}

        <div className={styles.share}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Share2 size={14} aria-hidden="true" /> Share this event</span>
          <a className={styles.chipLink} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${event.title} — ${url}`)}`}>
            <MessageCircle size={14} aria-hidden="true" /> WhatsApp
          </a>
        </div>
      </div>
    </aside>
  )
}
