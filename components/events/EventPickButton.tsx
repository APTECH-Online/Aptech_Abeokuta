'use client'

import { ArrowRight } from 'lucide-react'
import { SELECT_EVENT } from './event-meta'

/**
 * "Register for this event" on a card. It is a real #register link, so it still
 * scrolls to the form if JavaScript hasn't loaded; when it has, it also tells
 * the form which event to pre-select.
 */
export default function EventPickButton({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  return (
    <a
      href="#register"
      className="btn btn-primary btn-block"
      aria-label={`Register for this event: ${eventTitle}`}
      onClick={() => window.dispatchEvent(new CustomEvent(SELECT_EVENT, { detail: { eventId } }))}
    >
      Register for this event
      <ArrowRight size={17} aria-hidden="true" />
    </a>
  )
}
