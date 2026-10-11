import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { checkRateLimit } from '../../../../lib/rate-limit'
import { clientIpFromHeaders } from '../../../../lib/client-ip'
import { verifyTurnstile, TURNSTILE_FAILED_MESSAGE } from '../../../../lib/turnstile'
import { eventRegistrationSchema, registrationFieldErrors } from '../../../../lib/event-registration'
import { formatEventWhen, googleCalendarUrl } from '../../../../lib/event-calendar'
import { recordConsent } from '../../../../lib/consent'
import { logAudit } from '../../../../lib/audit'
import { sendEmail } from '../../../../lib/email/send'
import { eventRegistrationConfirmationEmail } from '../../../../lib/email/templates'
import { createNotification } from '../../../../lib/notifications'
import { getSiteUrl } from '../../../../lib/seo'

export const dynamic = 'force-dynamic'

type RegistrationRpcRow = {
  o_outcome: 'registered' | 'already_registered' | 'full' | 'closed'
  o_registration_id: string | null
  o_lead_id: string | null
  o_lead_reference: string | null
  o_is_new_lead: boolean
  o_spots_left: number | null
}

const json = (body: Record<string, unknown>, status = 200, extraHeaders?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: extraHeaders })

/** Browsers always send Origin on cross-site POSTs; reject any that is not this site. */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true // non-browser clients (curl, server-to-server) carry no Origin
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return json({ ok: false, message: 'This request was blocked.' }, 403)

    const ip = clientIpFromHeaders(await headers())
    const limit = await checkRateLimit(`event-registration:${ip}`)
    if (!limit.allowed) {
      return json(
        { ok: false, message: 'Too many attempts. Please wait a minute and try again.' },
        429,
        { 'Retry-After': String(limit.retryAfterSeconds ?? 60) }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') return json({ ok: false, message: 'Invalid request.' }, 400)

    const parsed = eventRegistrationSchema.safeParse(body)
    if (!parsed.success) {
      return json(
        { ok: false, message: 'Please check your details and try again.', fieldErrors: registrationFieldErrors(parsed.error) },
        400
      )
    }
    const input = parsed.data

    // Honeypot tripped: pretend it worked so bots learn nothing.
    if (input.company_website) return json({ ok: true, message: 'Registration received. We look forward to seeing you.' })

    const captcha = await verifyTurnstile(input.turnstile_token, ip)
    if (!captcha.ok) return json({ ok: false, message: TURNSTILE_FAILED_MESSAGE, code: 'turnstile' }, 400)

    let db: ReturnType<typeof createAdminClient>
    try {
      db = createAdminClient()
    } catch (err) {
      console.error('[events] Supabase unavailable', err)
      return json({ ok: false, message: 'Registration is temporarily unavailable. Please try again shortly.' }, 503)
    }

    const { data, error } = await db
      .rpc('register_for_campus_event', {
        p_event_id: input.event_id,
        p_full_name: input.full_name,
        p_email: input.email,
        p_phone: input.phone || null,
        p_interest: input.interest,
        p_preferred_contact: input.preferred_contact,
        p_marketing_consent: input.marketing_consent
      })
      .maybeSingle()

    const result = data as unknown as RegistrationRpcRow | null
    if (error || !result) {
      console.error('[events] register_for_campus_event failed', error)
      return json({ ok: false, message: 'We could not complete your registration. Please try again.' }, 500)
    }

    if (result.o_outcome === 'closed') {
      return json({ ok: false, code: 'closed', message: 'Registration for this event is closed.' }, 400)
    }
    if (result.o_outcome === 'full') {
      return json(
        { ok: false, code: 'full', message: 'Sorry, this session is fully booked. Please choose another event or contact the team to join the waiting list.' },
        409
      )
    }
    if (result.o_outcome === 'already_registered') {
      return json({ ok: true, alreadyRegistered: true, message: 'You are already registered for this event. We look forward to seeing you.' })
    }

    // --- Registered: everything below is best effort and must never fail the response ---
    const leadId = result.o_lead_id
    const { data: event } = await db
      .from('campus_events')
      .select('title,slug,starts_at,ends_at,location,delivery_mode,meeting_url')
      .eq('id', input.event_id)
      .maybeSingle()

    const eventsUrl = `${getSiteUrl()}/events`
    const calendarUrl = event
      ? googleCalendarUrl({
          title: event.title,
          startsAt: event.starts_at,
          endsAt: event.ends_at,
          location: event.delivery_mode === 'online' ? 'Online' : event.location,
          details: `Free event at APTECH Abeokuta. Details: ${eventsUrl}`
        })
      : null

    const sideEffects: Array<Promise<unknown>> = []
    if (leadId) {
      sideEffects.push(recordConsent(db, { leadId, source: 'event', marketingOptIn: input.marketing_consent, page: '/events' }))
      sideEffects.push(
        logAudit(db, {
          action: result.o_is_new_lead ? 'lead.created' : 'lead.contacted',
          entity: 'lead',
          entityId: leadId,
          metadata: { source: 'website', channel: 'event_registration', eventId: input.event_id }
        })
      )
    }
    if (event) {
      const online = event.delivery_mode === 'online' || event.delivery_mode === 'hybrid'
      sideEffects.push(
        sendEmail({
          to: input.email,
          ...eventRegistrationConfirmationEmail({
            firstName: input.full_name.split(/\s+/)[0],
            eventTitle: event.title,
            when: formatEventWhen(event.starts_at, event.ends_at),
            where: event.delivery_mode === 'online' ? 'Online' : event.location || 'APTECH Abeokuta',
            meetingUrl: online ? event.meeting_url : null,
            calendarUrl,
            eventsUrl
          })
        })
      )
      sideEffects.push(
        createNotification(db, {
          type: 'event.registered',
          title: `${input.full_name} registered for ${event.title}`,
          body: result.o_spots_left === null ? null : `${result.o_spots_left} place${result.o_spots_left === 1 ? '' : 's'} left`,
          link: leadId ? `/admin/leads/${leadId}` : '/admin/events',
          entity: 'lead',
          entityId: leadId,
          targetRoles: ['admissions_officer', 'super_admin']
        })
      )
      if (result.o_spots_left === 0) {
        sideEffects.push(
          createNotification(db, {
            type: 'event.full',
            title: `${event.title} is now fully booked`,
            link: '/admin/events',
            targetRoles: ['admissions_officer', 'super_admin']
          })
        )
      }
    }
    const settled = await Promise.allSettled(sideEffects)
    settled.forEach((r) => {
      if (r.status === 'rejected') console.error('[events] post-registration task failed', r.reason)
    })

    return json({
      ok: true,
      message: 'Registration received. We look forward to seeing you.',
      calendarUrl,
      spotsLeft: result.o_spots_left
    })
  } catch (err) {
    console.error('[events] unexpected registration error', err)
    return json({ ok: false, message: 'Registration is temporarily unavailable. Please try again shortly.' }, 500)
  }
}
