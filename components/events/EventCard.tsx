import { CalendarDays, Clock3, MapPin, Users } from 'lucide-react'
import { eventParts, eventStatus, timeRange } from '../insights/event-utils'
import { DELIVERY_MODES, EVENT_TYPES, eventWhere, type CampusEvent } from './event-meta'
import EventPickButton from './EventPickButton'

/**
 * One upcoming campus event. The calendar tile is the anchor: it is what the
 * visitor scans for ("which Saturday?"), and the same tile reappears in the
 * registration form once they pick the event. All times are shown in WAT.
 */
export default function EventCard({ event }: { event: CampusEvent }) {
  const parts = eventParts(event.starts_at)
  const status = eventStatus(event.starts_at, event.ends_at)
  const type = EVENT_TYPES[event.event_type ?? ''] ?? EVENT_TYPES.campus_event
  const mode = DELIVERY_MODES[event.delivery_mode ?? '']
  const TypeIcon = type.icon
  const ModeIcon = mode?.icon
  // "Upcoming" says nothing the date tile doesn't; only call out sessions that are close.
  const statusLabel = status && status.key !== 'upcoming' && status.key !== 'ended' ? status.label : null
  const urgent = status ? ['live', 'today', 'tomorrow'].includes(status.key) : false

  return (
    <article className="ev-card">
      <div className="ev-card__head">
        <div className="ev-date" aria-hidden="true">
          <span className="ev-date__wd">{parts.weekday}</span>
          <span className="ev-date__day">{parts.day}</span>
          <span className="ev-date__mo">{parts.month}</span>
        </div>
        <div className="ev-card__chips">
          <span className="ev-chip ev-chip--type"><TypeIcon size={14} aria-hidden="true" />{type.label}</span>
          {mode && ModeIcon && <span className="ev-chip ev-chip--mode"><ModeIcon size={14} aria-hidden="true" />{mode.label}</span>}
          {statusLabel && <span className={`ev-chip ${urgent ? 'ev-chip--urgent' : 'ev-chip--soon'}`}>{statusLabel}</span>}
        </div>
      </div>

      <div className="ev-card__body">
        <h3 className="ev-card__title">{event.title}</h3>
        {event.description?.trim() && <p className="ev-card__desc">{event.description.trim()}</p>}

        <ul className="ev-meta">
          <li>
            <CalendarDays size={16} aria-hidden="true" />
            <span><time dateTime={event.starts_at}>{parts.dateLong}</time></span>
          </li>
          <li>
            <Clock3 size={16} aria-hidden="true" />
            <span>{timeRange(event.starts_at, event.ends_at)} WAT</span>
          </li>
          <li>
            <MapPin size={16} aria-hidden="true" />
            <span>{eventWhere(event)}</span>
          </li>
          {event.capacity ? (
            <li>
              <Users size={16} aria-hidden="true" />
              <span>Limited to {event.capacity} places</span>
            </li>
          ) : null}
        </ul>

        <div className="ev-card__foot">
          <EventPickButton eventId={event.id} eventTitle={event.title} />
        </div>
      </div>
    </article>
  )
}
