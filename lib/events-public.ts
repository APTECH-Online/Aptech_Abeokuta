import 'server-only'
import { createAdminClient } from './supabase/admin'
import { availability } from './event-availability'
import type { CampusEvent } from '../components/events/event-meta'

const EVENT_COLUMNS = 'id,title,slug,event_type,description,starts_at,ends_at,location,delivery_mode,capacity,updated_at'

/** Registered-attendee totals per event (no personal data) from the service-role-only RPC. Best effort. */
async function getRegistrationCounts(db: ReturnType<typeof createAdminClient>): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  try {
    const { data, error } = await db.rpc('campus_event_registration_counts')
    if (error || !Array.isArray(data)) return counts
    for (const row of data as Array<{ o_event_id: string; o_registered_count: number | string }>) {
      counts.set(row.o_event_id, Number(row.o_registered_count))
    }
  } catch {
    // Migration 0041 not applied yet: availability is simply not shown.
  }
  return counts
}

/**
 * Upcoming events open for registration, with seats-left information. If the richer
 * query fails (for example a database that has not had every column migrated), fall
 * back to the three columns the form strictly needs so the page still works.
 */
export async function getUpcomingEvents(): Promise<CampusEvent[]> {
  try {
    const db = createAdminClient()
    const now = new Date().toISOString()
    const query = (columns: string) =>
      db.from('campus_events').select(columns).eq('registration_open', true).gte('starts_at', now).order('starts_at').limit(50)

    const full = await query(EVENT_COLUMNS)
    if (!full.error) {
      const events = (full.data ?? []) as unknown as CampusEvent[]
      const counts = await getRegistrationCounts(db)
      return events.map((event) => ({ ...event, ...availability(event.capacity, counts.get(event.id) ?? 0) }))
    }

    const basic = await query('id,title,starts_at')
    return ((basic.data ?? []) as unknown as Pick<CampusEvent, 'id' | 'title' | 'starts_at'>[]).map((e) => ({
      ...e, slug: null, event_type: null, description: null, ends_at: null, location: null, delivery_mode: null, capacity: null
    }))
  } catch {
    return []
  }
}
