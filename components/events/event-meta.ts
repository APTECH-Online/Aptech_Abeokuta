import { Briefcase, Building2, Code2, Globe, Laptop, Monitor, Sparkles, Video, type LucideIcon } from 'lucide-react'

/** Shape returned by the /events page query (campus_events, public columns only — no meeting_url). */
export type CampusEvent = {
  id: string
  title: string
  slug: string | null
  event_type: string | null
  description: string | null
  starts_at: string
  ends_at: string | null
  location: string | null
  delivery_mode: string | null
  capacity: number | null
}

/** Minimal slice the registration form needs to label options and show the picked-event summary. */
export type EventOption = Pick<CampusEvent, 'id' | 'title' | 'starts_at' | 'ends_at' | 'location' | 'delivery_mode'>

export const EVENT_TYPES: Record<string, { label: string; icon: LucideIcon }> = {
  coding_workshop: { label: 'Coding workshop', icon: Code2 },
  webinar: { label: 'Webinar', icon: Video },
  career_talk: { label: 'Career talk', icon: Briefcase },
  demonstration: { label: 'Live demonstration', icon: Monitor },
  open_day: { label: 'Open day', icon: Building2 },
  campus_event: { label: 'Campus event', icon: Sparkles }
}

export const DELIVERY_MODES: Record<string, { label: string; icon: LucideIcon }> = {
  in_person: { label: 'On campus', icon: Building2 },
  online: { label: 'Online', icon: Laptop },
  hybrid: { label: 'Campus + online', icon: Globe }
}

/** Where the event happens, in words a visitor understands. Online-only events have no venue to show. */
export function eventWhere(e: Pick<CampusEvent, 'location' | 'delivery_mode'>): string {
  if (e.delivery_mode === 'online') return 'Online'
  return e.location?.trim() || 'APTECH Abeokuta'
}

/**
 * Window event dispatched by a card's "Register" button and listened for by the
 * registration form, so the cards (server-rendered) can pre-select an event
 * in the form (client) without a shared wrapper component.
 */
export const SELECT_EVENT = 'aptech:select-event'
